import { v4 as uuid } from 'uuid';
import { useState } from 'react';
import { DialogTitle, Modal } from 'components/common/Modal';
import { Plugin } from '@bangle.dev/core';
import { Typography, Box } from '@mui/material';
import { useEditorState, BangleEditor } from '@bangle.dev/react';
import FieldLabel from 'components/settings/FieldLabel';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useUser } from 'hooks/useUser';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import PrimaryButton from 'components/common/PrimaryButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { Bounty, BOUNTY_STATUSES, BountyStatus } from 'models/Bounty';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, CryptoCurrencyList } from 'models/Currency';
import getDisplayName from 'lib/users/getDisplayName';

interface IToken {
  symbol: string;
  img: string;
}

const CRYPTO_CURRENCY_LIST = Object.keys(CryptoCurrencyList) as CryptoCurrency[];

type ModalType = 'create' | 'edit' | 'suggest';

interface Props {
  open: boolean;
  modalType: ModalType;
  bounty?: Bounty;
  onClose: () => void;
  onSubmit: (bounty: Bounty) => void;
}

const modalTitles: Record<ModalType, string> = {
  suggest: 'Suggest a Bounty',
  create: 'Create a Bounty',
  edit: 'Edit a Bounty'
};

export const descSchema = yup.object({
  type: yup.string(),
  content: yup.array()
});

export const schema = yup.object({
  author: yup.string().required(),
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: descSchema,
  type: yup.string().required().trim(),
  status: yup.mixed<BountyStatus>().oneOf([...BOUNTY_STATUSES]).required(),
  reviewer: yup.string().ensure().trim(),
  assignee: yup.string().ensure().trim(),
  rewardToken: yup.mixed<CryptoCurrency>().oneOf(CRYPTO_CURRENCY_LIST).required(),
  rewardAmount: yup.number().required()
});

export type FormValues = yup.InferType<typeof schema>;

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit: _onSubmit, modalType, bounty } = props;
  const [user] = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues:
      modalType !== 'edit'
        ? {
          author: user && getDisplayName(user),
          title: 'New Bounty',
          description: {
            type: 'doc',
            content: []
          },
          type: 'social',
          status: 'pending',
          rewardToken: 'ETH',
          reviewer: user && getDisplayName(user)
        }
        : bounty,
    resolver: yupResolver(schema)
  });

  const editorState = useEditorState({
    // TODO: somehow the bangle.dev not updating the new state
    initialValue: modalType === 'create' ? 'Edit bounty description...' : bounty?.description,
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              setValue('description', view.state.doc.toJSON() as FormValues['description']);
            }
          }
        })
      })
    ]
  });

  const handleStatusSelect = (e: SelectChangeEvent) => {
    setValue('status', e.target.value as BountyStatus);
  };

  const watchStatus = watch('status');

  function setToken (token: CryptoCurrency) {
    setValue('rewardToken', token);
  }

  if (modalType === 'edit' && !bounty) {
    return <span />;
  }

  function onSubmit (values: FormValues) {
    _onSubmit({
      id: uuid(),
      createdAt: new Date(),
      ...values
    });
  }

  return (
    <Modal size='large' open={open} onClose={onClose}>
      <DialogTitle onClose={onClose}>{modalTitles[modalType]}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <TextField
              {...register('title')}
              fullWidth
              error={!!errors.title}
              placeholder='Bounty title'
              helperText={errors.title?.message}
              variant='outlined'
            />
          </Grid>
          {modalType !== 'suggest' && (
            <Grid item>
              <Grid container direction='row' alignItems='center'>
                <Grid item xs={6}>
                  <Typography>Status</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Select
                    labelId='select-type'
                    id='select-type'
                    value={watchStatus}
                    variant='standard'
                    label='type'
                    onChange={handleStatusSelect}
                  >
                    <MenuItem value='pending'>
                      <Chip label='Not Started' color='primary' />
                    </MenuItem>
                    <MenuItem value='in-progress'>
                      <Chip label='In Progress' color='secondary' />
                    </MenuItem>
                    <MenuItem value='done'>
                      <Chip label='Done' color='secondary' />
                    </MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </Grid>
          )}

          <Grid item>
            <BangleEditor state={editorState} />
          </Grid>

          <Grid item>
            <FieldLabel>Reward</FieldLabel>
            <Divider />
            <Box>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Reviewer</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reviewer')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.reviewer}
                  />
                </Grid>
              </Grid>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Assignee</Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    {...register('assignee')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.assignee}
                  />
                </Grid>
              </Grid>

              {/* Render Token Select */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Token</Typography>
                </Grid>
                <Grid item xs={6}>
                  <InputSearchCrypto defaultValue={bounty?.rewardToken} onChange={setToken} />
                </Grid>
              </Grid>
              {/* Render token amount */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Amount</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('rewardAmount')}
                    fullWidth
                    variant='outlined'
                    type='number'
                    error={!!errors?.rewardAmount}
                  />
                </Grid>
              </Grid>
              <br />
              <Divider />
            </Box>
          </Grid>
          <Grid item>
            <Box display='flex' justifyContent='flex-end'>
              <PrimaryButton type='submit'>
                {modalType !== 'edit' ? 'Create' : 'Update'}
              </PrimaryButton>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Modal>
  );
}
