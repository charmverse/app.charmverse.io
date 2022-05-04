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
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { getSnapshotSpace, SnapshotReceipt, SnapshotSpace } from 'lib/snapshot';
import { ExternalServiceError, SystemError, UnknownError } from 'lib/utilities/errors';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import InputEnumToOption from 'components/common/form/InputEnumToOptions';
import ConnectSnapshot from './ConnectSnapshot';

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

export const schema = yup.object({
  startDate: yup.number().required(),
  endDate: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

interface Props {
  onSubmit: () => void,
  page: Page
}

const MAX_SNAPSHOT_PROPOSAL_CHARACTERS = 14400;

export default function PublishingForm ({ onSubmit, page }: Props) {

  const { account, library } = useWeb3React();

  const [space] = useCurrentSpace();

  const [startDate, setStartDate] = useState(Math.round((Date.now() / 1000) + 3600));

  const [endDate, setEndDate] = useState(startDate + 3600 * 24 * (space?.defaultVotingDuration ?? 1));

  const [snapshotSpace, setSnapshotSpace] = useState<SnapshotSpace | null>(null);
  // Ensure we don't show any UI until we are done checking
  const [checksComplete, setChecksComplete] = useState(false);

  const { pages, setPages } = usePages();

  const [configurationError, setConfigurationError] = useState<SystemError | null>(null);
  const [formError, setFormError] = useState<SystemError | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onBlur'
  });

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
          start: 0,
          end: endDate,
          snapshot: 0,
          network: '4',
          // strategies: JSON.stringify([]),
          // strategies: JSON.stringify([{ name: 'ticket', network: '4', params: {} }]),
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

  return (
    configurationError
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container direction='column' spacing={3}>
            <Grid item>
              <FieldLabel>Start date</FieldLabel>
              <DateTimePicker
                {...register('startDate')}
                value={startDate}
                onChange={(value) => {
                  console.log(value);
                }}
                renderInput={(props) => <TextField fullWidth {...props} />}
              />
            </Grid>

            {
              /**
            <Grid item>
              <FieldLabel>End date</FieldLabel>
              <DateTimePicker
                {...register('endDate')}
                helperText={errors.endDate?.message}
              />
            </Grid>
               */
            }

            {
            formError && (
              <Grid item>
                <Alert severity={formError.severity as AlertColor}>{formError.message ?? (formError as any).error}</Alert>
              </Grid>
            )
          }

            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton onClick={publish} disabled={false} type='submit'>
                Publish to snapshot
              </PrimaryButton>
            </Grid>
          </Grid>
        </form>

      )
    }

        </Box>
      )

  );
}
