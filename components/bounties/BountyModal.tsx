import { Modal, DialogTitle } from 'components/common/Modal';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import { Typography, Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useEditorState, BangleEditor } from '@bangle.dev/react';
import { Plugin } from '@bangle.dev/core';
import _ from 'lodash';

import * as yup from 'yup';
import styled from '@emotion/styled';

interface IToken {
  symbol: string;
  img: string;
}
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
  type: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (item: any) => void;
}

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
  title: yup.string().ensure().trim().lowercase()
    .required('Title is required'),
  description: descSchema,
  type: yup.string().ensure().trim(),
  status: yup.string().ensure().trim(),
  reward: rewardSchema
});

export type FormValues = yup.InferType<typeof schema>;

export default function BountyModal (props: Props) {
  const { open, onClose, onSubmit, type } = props;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      title: 'New bounty',
      description: {
        type: 'doc',
        content: []
      },
      type: 'social',
      status: 'pending',
      reward: {
        token: 'CHARM',
        reviewer: 'me'
      }
    },
    resolver: yupResolver(schema)
  });
  const editorState = useEditorState({
    initialValue: 'Hello world!',
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
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

  const watchType = watch('type');
  const watchToken = watch('reward.token');

  return (
    <Modal open={true} onClose={onClose}>
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
                    helperText={errors.reward?.reviewer?.message}
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
                    helperText={errors.reward?.assignee?.message}
                  />
                </Grid>
              </Grid>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Token</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Autocomplete
                    id='token-select'
                    options={tokens}
                    autoHighlight
                    onInputChange={(event, newInputValue) => {
                      setValue('reward.token', newInputValue);
                    }}
                    inputValue={watchToken}
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
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Amount</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reward.amount')}
                    fullWidth
                    variant='standard'
                    error={!!errors.reward?.assignee}
                    helperText={errors.reward?.assignee?.message}
                  />
                </Grid>
              </Grid>
              <br />
              <Divider />
            </Box>
          </Grid>
          <Grid item>
            <PrimaryButton type='submit'>Add Bounty</PrimaryButton>
          </Grid>
        </Grid>
      </form>
    </Modal>
  );
}
