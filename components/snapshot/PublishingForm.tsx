import { yupResolver } from '@hookform/resolvers/yup';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useWeb3React } from '@web3-react/core';
import snapshot from '@snapshot-labs/snapshot.js';
import FieldLabel from 'components/common/form/FieldLabel';
import PrimaryButton from 'components/common/PrimaryButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { getSnapshotSpace } from 'lib/snapshot/get-space';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';
import { isTruthy } from 'lib/utilities/types';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { SystemError } from 'lib/utilities/errors';
import { useState } from 'react';
import charmClient from 'charmClient';
import Alert from '@mui/material/Alert';
import { usePages } from 'hooks/usePages';
import { Page } from '@prisma/client';
import { SnapshotReceipt } from 'lib/snapshot';
import { DateTimePicker } from '@mui/x-date-pickers';

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

export default function PublishingForm ({ onSubmit, page }: Props) {

  const { account, library } = useWeb3React();

  const [space] = useCurrentSpace();

  const [startDate, setStartDate] = useState(Math.round((Date.now() / 1000) + 3600));

  const [endDate, setEndDate] = useState(startDate + 3600 * 24 * (space?.defaultVotingDuration ?? 1));

  const [spaceCanPostToSnapshot, setSpaceCanPostToSnapshot] = useState(false);
  const [userCanPostToSnapshot, setUserCanPostToSnapshot] = useState(false);

  const { pages, setPages } = usePages();

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

  async function publish () {
    if (account) {

      const content = generateMarkdown(page, false);

      const currentBlockNum = await library.getBlockNumber();

      const receipt = await client.proposal(library, account, {
        space: space?.snapshotDomain as any,
        type: 'single-choice',
        title: page.title,
        body: content,
        choices: ['Yay', 'Neigh'],
        start: startDate,
        end: endDate,
        snapshot: 0,
        network: '4',
        strategies: JSON.stringify([{ name: 'ticket', network: '4', params: {} }]),
        plugins: JSON.stringify({}),
        metadata: JSON.stringify({})
      } as any) as SnapshotReceipt;

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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <FieldLabel>Start date</FieldLabel>
          <DateTimePicker
            {...register('startDate')}
            sx={{ zIndex: 1000 }}
            value={startDate}
            onChange={(value) => {
              console.log(value);
            }}
            InputProps={{ borderColour: 'default' }}
            renderInput={(props) => <TextField {...props} />}
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
              <Alert severity='error'>{formError.message ?? (formError as any).error}</Alert>
            </Grid>
          )
        }

        <Grid item display='flex' justifyContent='space-between'>
          <PrimaryButton disabled={!isValid} type='submit'>
            Publish to snapshot
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  );
}
