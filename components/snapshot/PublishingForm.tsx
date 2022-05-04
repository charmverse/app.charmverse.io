import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@mui/material';
import Alert, { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Page } from '@prisma/client';
import snapshot from '@snapshot-labs/snapshot.js';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import FieldLabel from 'components/common/form/FieldLabel';
import PrimaryButton from 'components/common/PrimaryButton';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { getSnapshotSpace, SnapshotReceipt, SnapshotSpace, SnapshotVotingStrategy } from 'lib/snapshot';
import { ExternalServiceError, SystemError, UnknownError } from 'lib/utilities/errors';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import InputEnumToOption from 'components/common/form/InputEnumToOptions';
import { DateTime } from 'luxon';
import ConnectSnapshot from './ConnectSnapshot';
import InputVotingStrategies from './InputVotingStrategies';

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

interface Props {
  onSubmit: () => void,
  page: Page
}

const MAX_SNAPSHOT_PROPOSAL_CHARACTERS = 14400;

export default function PublishingForm ({ onSubmit, page }: Props) {

  const { account, library } = useWeb3React();

  const [space] = useCurrentSpace();

  const [snapshotSpace, setSnapshotSpace] = useState<SnapshotSpace | null>(null);
  // Ensure we don't show any UI until we are done checking
  const [checksComplete, setChecksComplete] = useState(false);

  const { pages, setPages } = usePages();

  const [configurationError, setConfigurationError] = useState<SystemError | null>(null);

  // Form data
  const [startDate, setStartDate] = useState<DateTime>(DateTime.fromMillis(Date.now()).plus({ hour: 1 }));
  const [endDate, setEndDate] = useState<DateTime>((DateTime.fromMillis(startDate.toMillis())).plus({ days: space?.defaultVotingDuration ?? 7 }));
  const [selectedVotingStrategies, setSelectedVotingStrategies] = useState<SnapshotVotingStrategy[]>([]);
  const [formError, setFormError] = useState<SystemError | null>(null);

  useEffect(() => {
    verifyUserCanPostToSnapshot();
  }, [space, snapshotSpace, page]);

  useEffect(() => {
    checkMarkdownLength();
  }, [page]);

  function checkMarkdownLength () {
    const content = generateMarkdown(page, false);

    const markdownCharacterLength = content.length;

    if (markdownCharacterLength > MAX_SNAPSHOT_PROPOSAL_CHARACTERS) {
      setConfigurationError(
        new SystemError({
          errorType: 'Maximum size exceeded',
          severity: 'warning',
          message: `The character count of your proposal is ${markdownCharacterLength}.\r\n\nThis exceeds Snapshot's limit of ${MAX_SNAPSHOT_PROPOSAL_CHARACTERS}.\r\n\nTo fix this, reduce text size and check for inline images which were pasted directly instead of being configured with a link.`
        })
      );

    }
  }

  async function verifyUserCanPostToSnapshot () {
    setChecksComplete(false);
    if (!space || !space?.snapshotDomain) {
      setSnapshotSpace(null);
      setConfigurationError(
        new SystemError({
          errorType: 'Data not found',
          severity: 'warning',
          message: 'This space must be connected to Snapshot.org before you can export proposals there.'
        })
      );
    }
    else if (space.snapshotDomain && !snapshotSpace) {
      const existingSnapshotSpace = await getSnapshotSpace(space.snapshotDomain);
      setSnapshotSpace(existingSnapshotSpace);
    }

    if (snapshotSpace) {

      const hasStrategies = snapshotSpace.strategies.length > 0;

      if (!hasStrategies) {
        setConfigurationError(
          new SystemError({
            errorType: 'Invalid input',
            severity: 'warning',
            message: 'You need at least one voting strategy for this space. Visit your space settings on snapshot.org to fix this.'
          })
        );
        setChecksComplete(true);
      }

      const userCanPost = snapshotSpace.filters.onlyMembers === false
        || (snapshotSpace.filters.onlyMembers && snapshotSpace.members.indexOf(account as string) > -1);

      if (userCanPost === false) {
        setConfigurationError(
          new SystemError({
            errorType: 'Access denied',
            severity: 'warning',
            message: 'You are not permitted to publish proposals to this snapshot space.\r\n\nIf you believe this should be the case, reach out to the person in charge of your Snapshot.org space.'
          })
        );
      }
      else {
        setConfigurationError(null);
      }
    }

    setChecksComplete(true);

  }

  async function publish () {

    setFormError(null);

    if (account) {

      const content = generateMarkdown(page, false);

      const currentBlockNum = await library.getBlockNumber();

      let receipt: SnapshotReceipt;

      try {
        receipt = await client.proposal(library, account, {
          space: space?.snapshotDomain as any,
          type: 'single-choice',
          title: page.title,
          body: content,
          choices: ['Yay', 'Neigh'],
          start: startDate,
          end: endDate,
          snapshot: 0,
          network: snapshotSpace?.network,
          // strategies: JSON.stringify([]),
          strategies: JSON.stringify([{ name: 'ticket', network: '4', params: {} }]),
          plugins: JSON.stringify({}),
          metadata: JSON.stringify({})
        } as any) as SnapshotReceipt;

      }
      catch (err: any) {

        const errorToShow = err?.error_description ? new ExternalServiceError(`Snapshot error: ${err?.error_description}`) : new UnknownError();

        setFormError(errorToShow);
        return;
      }

      const updatedPage = await charmClient.updatePageSnapshotData(page.id, {
        snapshotProposalId: receipt.id
      });

      console.log('Receipt', receipt);
      setPages({
        ...pages,
        [page.id]: updatedPage
      });

      onSubmit();

    }
  }

  const voteDuration = (endDate && startDate) ? Math.abs(Math.round(endDate.diff(startDate, 'days').days)) : undefined;

  const endDateAfterStart = startDate && endDate && endDate.diff(startDate, 'seconds').seconds > 0;

  function formValid () {
    return selectedVotingStrategies.length > 0 && endDateAfterStart;
  }

  return (
    !checksComplete ? <LoadingIcon />

      : (configurationError
        ? (
          <>

            <Box sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
              <Alert severity={configurationError.severity as AlertColor}>{configurationError.message}</Alert>
            </Box>
            {
          !snapshotSpace && (
          <ConnectSnapshot />
          )
        }
          </>
        )

      // Only proceed with rest of UI if proposal has correct length
        : (
          <Box>

            {
      checksComplete && snapshotSpace && (
        <form onSubmit={publish}>
          <Grid container direction='column' spacing={3}>

            <Grid item>
              <InputVotingStrategies strategies={snapshotSpace.strategies} onChange={(selected) => setSelectedVotingStrategies(selected)} />
            </Grid>

            <Grid item>
              <FieldLabel>Start date</FieldLabel>
              <DateTimePicker
                value={startDate}
                onChange={(value) => {
                  if (value instanceof DateTime) {
                    setStartDate(value as DateTime);
                  }

                }}
                renderInput={(props) => <TextField fullWidth {...props} />}
              />
            </Grid>

            <Grid item>
              <FieldLabel>End date</FieldLabel>
              <DateTimePicker
                minDateTime={startDate}
                value={endDate}
                onChange={(value) => {
                  if (value instanceof DateTime) {
                    setEndDate(value as DateTime);
                  }
                }}
                renderInput={(props) => <TextField fullWidth {...props} error={!endDateAfterStart} helperText={!endDateAfterStart ? 'End date must be after start date' : null} />}
              />
            </Grid>

            {
              endDateAfterStart && (
                <Grid item>
                  <Typography>Voting will last {voteDuration} day{voteDuration !== 1 ? 's' : ''}</Typography>
                </Grid>
              )
            }

            {
            formError && (
              <Grid item>
                <Alert severity={formError.severity as AlertColor}>{formError.message ?? (formError as any).error}</Alert>
              </Grid>
            )
          }

            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton onClick={publish} disabled={!formValid()} type='submit'>
                Publish to snapshot
              </PrimaryButton>
            </Grid>
          </Grid>
        </form>

      )
    }

          </Box>
        )
      )
  );
}
