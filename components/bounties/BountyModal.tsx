import _ from 'lodash';
import { Modal } from 'components/common/Modal';
import { Plugin } from '@bangle.dev/core';
import { Typography, Box } from '@mui/material';
import { useEditorState, BangleEditor } from '@bangle.dev/react';
import { useForm } from 'react-hook-form';
import { useUser } from 'hooks/useUser';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import PrimaryButton from 'components/common/PrimaryButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { TBountyCard } from 'models/Bounty';
import { useState } from 'react';

interface IToken {
  symbol: string;
  img: string;
}

// xtungvo TODO: update this list
const tokens: readonly IToken[] = [
  {
    symbol: 'CHARM',
    img: 'https://media-exp1.licdn.com/dms/image/C560BAQFfixfL2L4FHQ/company-logo_200_200/0/1640872171070?e=2159024400&v=beta&t=VmnRYP4llSkrQUizgSjkB_Jd7wcSYL1sbDpvXnBD2Yo'
  },
  {
    symbol: 'ETH',
    img: 'https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/1024/Ethereum-ETH-icon.png'
  },

  {
    symbol: 'USDT',
    img: 'https://w7.pngwing.com/pngs/803/844/png-transparent-usdt-crypto-cryptocurrency-cryptocurrencies-cash-money-bank-payment-icon-thumbnail.png'
  }
];

interface Props {
  open: boolean;
  modalType?: 'create' | 'edit';
  bounty?: TBountyCard;
  onClose: () => void;
  onSubmit: (item: any) => void;
}

// xtungvo TODO: update this bunchs of schema
export const rewardSchema = yup.object({
  reviewer: yup.string().ensure().trim(),
  assignee: yup.string().ensure().trim(),
  token: yup.string().ensure().trim(),
  amount: yup.number()
});
export const descSchema = yup.object({
  type: yup.string(),
  content: yup.array()
});

export const schema = yup.object({
  author: yup.string(),
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: descSchema,
  type: yup.string().ensure().trim(),
  status: yup.string().ensure().trim(),
  reward: rewardSchema
});

export type FormValues = yup.InferType<typeof schema>;

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, modalType, bounty } = props;
  const [tokenInput, setTokenInput] = useState('');
  const [user] = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues:
      modalType === 'create'
        ? {
          author: user?.username || '',
          title: 'New bounty',
          description: {
            type: 'doc',
            content: []
          },
          type: 'social',
          status: 'pending',
          reward: {
            token: 'CHARM',
            reviewer: user?.username || ''
          }
        }
        : bounty,
    resolver: yupResolver(schema)
  });

  const editorState = useEditorState({
    // xtungvo TODO: somehow the bangle.dev not updating the new state
    initialValue: modalType === 'create' ? 'Edit bounty description...' : bounty?.description,
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              // xtungvo TODO: fix this typing error
              setValue('description', view.state.doc.toJSON());
            }
          }
        })
      })
    ]
  });

  const handleTypeSelect = (e: SelectChangeEvent) => {
    setValue('type', e.target.value as string);
  };

  const handleStatusSelect = (e: SelectChangeEvent) => {
    setValue('status', e.target.value as string);
  };

  const watchType = watch('type');
  const watchStatus = watch('status');
  const defaultValue = modalType === 'create' ? tokens[0] : _.find(tokens, { symbol: bounty?.reward?.token });

  if (modalType === 'edit' && !bounty) {
    return <span />;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <TextField
              {...register('title')}
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
              variant='standard'
            />
          </Grid>
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
                  <MenuItem value='inprogress'>
                    <Chip label='In Progress' color='secondary' />
                  </MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction='row' alignItems='center'>
              <Grid item xs={6}>
                <Typography>Type</Typography>
              </Grid>
              <Grid item xs={6}>
                <Select
                  labelId='select-type'
                  id='select-type'
                  value={watchType}
                  variant='standard'
                  label='type'
                  onChange={handleTypeSelect}
                >
                  <MenuItem value='social'>
                    <Chip label='SOCIAL' color='primary' />
                  </MenuItem>
                  <MenuItem value='content'>
                    <Chip label='CONTENT' color='secondary' />
                  </MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <BangleEditor state={editorState} />
          </Grid>

          {/* // xtungvo TODO: Move to separated component */}
          <Grid item>
            <Typography variant='h5'>Reward</Typography>
            <Divider />
            <Box>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Reviewer</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reward.reviewer')}
                    fullWidth
                    variant='standard'
                    error={!!errors.reward?.reviewer}
                  />
                </Grid>
              </Grid>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Assignee</Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    {...register('reward.assignee')}
                    fullWidth
                    variant='standard'
                    error={!!errors.reward?.assignee}
                  />
                </Grid>
              </Grid>

              {/* Render Token Select */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Token</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Autocomplete
                    id='token-select'
                    options={tokens}
                    autoHighlight
                    onChange={(event: any, newValue: IToken | null) => {
                      if (newValue?.symbol) {
                        setValue('reward.token', newValue?.symbol);
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      setTokenInput(newInputValue);
                    }}
                    inputValue={tokenInput}
                    defaultValue={defaultValue}
                    getOptionLabel={(option) => option.symbol}
                    renderOption={(renderProps, option) => (
                      <Box
                        component='li'
                        sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                        {...renderProps}
                      >
                        <img loading='lazy' width='20' src={option.img} alt='' />
                        {option.symbol}
                      </Box>
                    )}
                    renderInput={(params) => {
                      // xtungvo TODO: fix this typing error
                      const inputValue = params.inputProps.value;
                      const tokenImg = _.find(tokens, { symbol: inputValue })?.img;
                      return (
                        <Grid
                          container
                          direction='row'
                          sx={{ alignItems: 'center', position: 'relative' }}
                        >
                          {tokenImg && (
                            <div style={{ position: 'absolute', left: '-30px', top: '8px' }}>
                              <img loading='lazy' width='20' src={tokenImg} alt='' />
                            </div>
                          )}
                          <TextField
                            {...params}
                            variant='standard'
                            inputProps={{
                              ...params.inputProps,
                              autoComplete: 'new-password' // disable autocomplete and autofill
                            }}
                          />
                        </Grid>
                      );
                    }}
                  />
                </Grid>
              </Grid>
              {/* Render token amount */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Amount</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reward.amount')}
                    fullWidth
                    variant='standard'
                    type='number'
                    error={!!errors.reward?.amount}
                  />
                </Grid>
              </Grid>
              <br />
              <Divider />
            </Box>
          </Grid>
          <Grid item>
            <PrimaryButton type='submit'>
              {modalType === 'create' ? 'Add Bounty' : 'Update Bounty'}
            </PrimaryButton>
          </Grid>
        </Grid>
      </form>
    </Modal>
  );
}
