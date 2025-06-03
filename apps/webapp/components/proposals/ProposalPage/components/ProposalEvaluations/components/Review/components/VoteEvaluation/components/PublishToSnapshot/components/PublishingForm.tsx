import { log } from '@charmverse/core/log';
import { Typography } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { getSnapshotClient } from '@packages/lib/snapshot/getSnapshotClient';
import { getSnapshotSpace } from '@packages/lib/snapshot/getSpace';
import type { SnapshotReceipt, SnapshotSpace, SnapshotVotingStrategy } from '@packages/lib/snapshot/interfaces';
import { SnapshotVotingMode } from '@packages/lib/snapshot/interfaces';
import { ExternalServiceError, MissingWeb3AccountError, SystemError, UnknownError } from '@packages/utils/errors';
import { lowerCaseEqual } from '@packages/utils/strings';
import type { ProposalType } from '@snapshot-labs/snapshot.js/dist/sign/types';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { getAddress } from 'viem';

import charmClient from 'charmClient';
import { useUpdateSnapshotProposal } from 'charmClient/hooks/proposals';
import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import { DateTimePicker } from 'components/common/DateTimePicker';
import FieldLabel from 'components/common/form/FieldLabel';
import InputEnumToOption from 'components/common/form/InputEnumToOptions';
import InputGeneratorText from 'components/common/form/InputGeneratorText';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useWeb3Account } from 'hooks/useWeb3Account';

import ConnectSnapshot from './ConnectSnapshot';
import { InputVotingStrategies } from './InputVotingStrategies';

interface Props {
  onSubmit: () => void;
  pageId: string;
  proposalId: string;
  evaluationId: string;
}

const MAX_SNAPSHOT_PROPOSAL_CHARACTERS = 20000;

const MIN_VOTING_OPTIONS = 2;

/**
 *
 * @abstract See this code for restrictions enforced by Snapshot when submitting proposals
 * https://github.com/snapshot-labs/snapshot-sequencer/blob/24fba742c89790c7d955c520b4d36c96e883a3e9/src/writer/proposal.ts#L83C29-L83C29
 */
export function PublishingForm({ onSubmit, pageId, proposalId, evaluationId }: Props) {
  const { account, provider: web3Provider } = useWeb3Account();
  const { trigger: updateProposalEvaluation } = useUpdateSnapshotProposal({ proposalId });

  const { space } = useCurrentSpace();
  const { members } = useMembers();

  const [snapshotSpace, setSnapshotSpace] = useState<SnapshotSpace | null>(null);
  // Ensure we don't show any UI until we are done checking
  const [checksComplete, setChecksComplete] = useState(false);

  const [configurationError, setConfigurationError] = useState<SystemError | null>(null);

  // Form data
  const [startDate, setStartDate] = useState<DateTime>(DateTime.fromMillis(Date.now()).plus({ hour: 1 }));
  const [endDate, setEndDate] = useState<DateTime>(DateTime.fromMillis(startDate.toMillis()).plus({ days: 7 }));
  const [selectedVotingStrategies, setSelectedVotingStrategies] = useState<SnapshotVotingStrategy[]>([]);
  const [snapshotBlockNumber, setSnapshotBlockNumber] = useState<number | null>(null);
  const [snapshotVoteMode, setSnapshotVoteMode] = useState<ProposalType>('single-choice');
  const [votingOptions, setVotingOptions] = useState<string[]>(['For', 'Against', 'Abstain']);

  const [formError, setFormError] = useState<SystemError | null>(null);

  const [publishing, setPublishing] = useState(false);
  const isAdmin = useIsAdmin();
  useEffect(() => {
    if (!snapshotBlockNumber) {
      setCurrentBlockNumberAsDefault();
    }
  }, [snapshotSpace]);

  useEffect(() => {
    if (snapshotSpace?.voting.period && startDate) {
      setEndDate(DateTime.fromMillis(startDate.toMillis()).plus({ seconds: snapshotSpace.voting.period }));
    }
  }, [startDate, snapshotSpace]);

  useEffect(() => {
    verifyUserCanPostToSnapshot();
  }, [space, snapshotSpace, pageId]);

  async function setCurrentBlockNumberAsDefault() {
    if (snapshotSpace) {
      try {
        const snapshot = (await import('@snapshot-labs/snapshot.js')).default;
        const provider = await snapshot.utils.getProvider(snapshotSpace.network);
        const blockNum = await provider.getBlockNumber();
        setSnapshotBlockNumber(blockNum);
      } catch (err) {
        setSnapshotBlockNumber(0);
      }
    }
  }

  /**
   * Returns markdown content if valid length, or null if not
   */
  async function checkMarkdownLength(): Promise<string | null> {
    try {
      const pageWithDetails = await charmClient.pages.getPage(pageId);
      const content = await generateMarkdown({
        content: pageWithDetails.content,
        generatorOptions: {
          members
        }
      });

      const markdownCharacterLength = content.length;

      if (markdownCharacterLength > MAX_SNAPSHOT_PROPOSAL_CHARACTERS) {
        setConfigurationError(
          new SystemError({
            errorType: 'Maximum size exceeded',
            severity: 'warning',
            message: `The character count of your proposal is ${markdownCharacterLength}.\r\n\nThis exceeds Snapshot's limit of ${MAX_SNAPSHOT_PROPOSAL_CHARACTERS}.\r\n\nTo fix this, reduce text size and check for inline images which were pasted directly instead of being configured with a link.`
          })
        );
        return null;
      }

      return content;
    } catch (err) {
      log.error('Error generating markdown', err);
      return null;
    }
  }

  async function verifyUserCanPostToSnapshot() {
    setChecksComplete(false);
    if (!space || !space?.snapshotDomain) {
      setSnapshotSpace(null);
      setConfigurationError(
        new SystemError({
          errorType: 'Data not found',
          severity: 'warning',
          message:
            'This space must be connected to Snapshot.org before you can export proposals to it. Only space admins can connect Snapshot to this Space.'
        })
      );
    } else if (space.snapshotDomain && !snapshotSpace) {
      const existingSnapshotSpace = await getSnapshotSpace(space.snapshotDomain);
      setSnapshotSpace(existingSnapshotSpace);
      setSnapshotVoteMode(existingSnapshotSpace?.voting?.type ?? 'single-choice');
    }

    if (snapshotSpace) {
      const hasStrategies = snapshotSpace.strategies.length > 0;

      if (!hasStrategies) {
        setConfigurationError(
          new SystemError({
            errorType: 'Invalid input',
            severity: 'warning',
            message:
              'You need at least one voting strategy for this space. Visit your space settings on snapshot.org to fix this.'
          })
        );
        setChecksComplete(true);
      }

      const userCanPost =
        snapshotSpace.filters.onlyMembers === false ||
        (snapshotSpace.filters.onlyMembers &&
          account &&
          [...snapshotSpace.admins, ...snapshotSpace.members, ...snapshotSpace.moderators].some((val) =>
            lowerCaseEqual(val, account as string)
          ));
      if (userCanPost === false) {
        setConfigurationError(
          new SystemError({
            errorType: 'Access denied',
            severity: 'warning',
            message:
              'You are not permitted to publish proposals to this snapshot space.\r\n\nIf you believe this should be the case, reach out to the person in charge of your Snapshot.org space.'
          })
        );
      } else {
        setConfigurationError(null);

        await checkMarkdownLength();
      }
    }

    setChecksComplete(true);
  }

  async function publish() {
    setFormError(null);
    setPublishing(true);

    try {
      const pageWithDetails = await charmClient.pages.getPage(pageId);

      const content = await generateMarkdown({
        content: pageWithDetails.content,
        generatorOptions: { members }
      });
      if (!account || !web3Provider) {
        throw new MissingWeb3AccountError();
      }

      if (!snapshotBlockNumber) {
        throw new SystemError({
          errorType: 'External service',
          severity: 'warning',
          message: 'Could not retrieve block number from Snapshot. Please enter this manually.'
        });
      }

      const client = await getSnapshotClient();

      const start = Math.round(startDate.toSeconds());
      const proposalParams: any = {
        space: space?.snapshotDomain as any,
        type: snapshotVoteMode,
        title: pageWithDetails.title,
        body: content,
        choices: votingOptions,
        start,
        end: Math.round(endDate.toSeconds()),
        snapshot: snapshotBlockNumber,
        network: snapshotSpace?.network,
        strategies: JSON.stringify(selectedVotingStrategies),
        plugins: JSON.stringify({}),
        metadata: JSON.stringify({}),
        app: ''
      };

      if (snapshotSpace?.voting.delay) {
        const timestampWithVotingDelay = start - snapshotSpace.voting.delay;
        proposalParams.timestamp = timestampWithVotingDelay;
      }
      const receipt: SnapshotReceipt = (await client.proposal(
        web3Provider,
        getAddress(account as string),
        proposalParams
      )) as SnapshotReceipt;
      await updateProposalEvaluation({
        evaluationId,
        snapshotProposalId: receipt.id
      });
      charmClient.track.trackAction('new_vote_created', {
        platform: 'snapshot',
        pageId,
        resourceId: receipt.id,
        spaceId: space?.id || ''
      });

      onSubmit();
    } catch (err: any) {
      log.error('Error while publishing to snapshot', err);

      const errorToShow =
        err instanceof SystemError
          ? err
          : (err as any)?.error_description
            ? new ExternalServiceError(`Snapshot error: ${err?.error_description}`)
            : new UnknownError();

      setFormError(errorToShow);
    }
    setPublishing(false);
  }

  const voteDuration = endDate && startDate ? Math.abs(Math.round(endDate.diff(startDate, 'days').days)) : undefined;

  const endDateAfterStart = startDate && endDate && endDate.diff(startDate, 'seconds').seconds > 0;

  function formValid() {
    return (
      selectedVotingStrategies.length > 0 &&
      endDateAfterStart &&
      !!snapshotBlockNumber &&
      votingOptions.length >= MIN_VOTING_OPTIONS
    );
  }

  const snapshotVotingType = snapshotSpace?.voting?.type ?? null;

  return !checksComplete ? (
    <LoadingIcon />
  ) : configurationError ? (
    <>
      <Box sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
        <Alert severity={configurationError.severity as AlertColor}>{configurationError.message}</Alert>
      </Box>
      {!snapshotSpace && isAdmin && <ConnectSnapshot />}
    </>
  ) : (
    // Only proceed with rest of UI if proposal has correct length
    <Box>
      {checksComplete && snapshotSpace && (
        <form onSubmit={(ev) => ev.preventDefault()}>
          <Grid container direction='column' spacing={3}>
            <Grid>
              <FieldLabel>Voting type</FieldLabel>
              <Tooltip
                title={
                  snapshotSpace?.voting.type
                    ? 'This option is readonly because it is enforced for your space inside Snapshot'
                    : ''
                }
              >
                <InputEnumToOption
                  value={snapshotVoteMode}
                  readOnly={!!snapshotSpace?.voting.type}
                  keyAndLabel={
                    snapshotVotingType === null
                      ? SnapshotVotingMode
                      : { [snapshotVotingType]: SnapshotVotingMode[snapshotVotingType] }
                  }
                  onChange={(voteMode) => setSnapshotVoteMode(voteMode as ProposalType)}
                />
              </Tooltip>
            </Grid>

            <Grid>
              <InputVotingStrategies
                strategies={snapshotSpace.strategies}
                onChange={(selected) => setSelectedVotingStrategies(selected)}
              />
            </Grid>

            <Grid>
              <InputGeneratorText
                defaultOptions={votingOptions}
                title='Voting options'
                minimumOptions={MIN_VOTING_OPTIONS}
                onChange={(options) => setVotingOptions(options)}
              />
            </Grid>

            <Grid>
              <FieldLabel>Block number</FieldLabel>
              {snapshotBlockNumber == null ? (
                <>
                  <LoadingIcon size={18} sx={{ mr: 1 }} />
                  Getting current block number
                </>
              ) : (
                <TextField
                  error={!snapshotBlockNumber}
                  defaultValue={snapshotBlockNumber}
                  type='number'
                  onInput={(input: any) => {
                    setSnapshotBlockNumber(parseInt(input.target.value));
                  }}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
                  fullWidth
                  helperText={`This is the block number on the ${
                    getChainById(parseInt(snapshotSpace.network))?.chainName ?? ''
                  } blockchain by which DAO members must have held tokens to be able to vote.`}
                />
              )}
            </Grid>

            <Grid display='flex' gap={1} justifyContent='space-between'>
              <div
                style={{
                  flexGrow: 1
                }}
              >
                <FieldLabel>Start date</FieldLabel>
                <DateTimePicker
                  value={startDate}
                  onChange={(value) => {
                    if (value instanceof DateTime) {
                      setStartDate(value);
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </div>

              <Tooltip
                title={
                  snapshotSpace?.voting.period
                    ? 'End date is automatically defined by the voting duration configured for your space in Snapshot.org'
                    : ''
                }
              >
                <div
                  style={{
                    flexGrow: 1
                  }}
                >
                  <FieldLabel>End date</FieldLabel>
                  <DateTimePicker
                    minDateTime={startDate}
                    value={endDate}
                    onChange={(value) => {
                      if (value instanceof DateTime) {
                        setEndDate(value);
                      }
                    }}
                    disabled={!!snapshotSpace.voting.period}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        disabled: !!snapshotSpace.voting.period,
                        error: !endDateAfterStart,
                        helperText: !endDateAfterStart ? 'End date must be after start date' : null
                      }
                    }}
                  />
                </div>
              </Tooltip>
            </Grid>

            {endDateAfterStart && (
              <Grid>
                <Typography>
                  Voting will last {voteDuration} day{voteDuration !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            )}

            {formError && (
              <Grid>
                {formError instanceof MissingWeb3AccountError ? (
                  <Alert
                    sx={{ alignItems: 'center' }}
                    action={!web3Provider ? <OpenWalletSelectorButton color='inherit' /> : null}
                    severity={formError.severity as AlertColor}
                  >
                    We couldn't detect your wallet. Please unlock your wallet and try publishing again.
                  </Alert>
                ) : (
                  <Alert severity={formError.severity as AlertColor}>
                    {formError.message ?? (formError as any).error}
                  </Alert>
                )}
              </Grid>
            )}

            <Grid display='flex' justifyContent='flex-end'>
              <Button onClick={publish} disabled={!formValid() || publishing} type='submit'>
                {publishing ? (
                  <>
                    <LoadingIcon size={18} sx={{ mr: 1 }} />
                    Publishing
                  </>
                ) : (
                  'Publish to Snapshot'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
}
