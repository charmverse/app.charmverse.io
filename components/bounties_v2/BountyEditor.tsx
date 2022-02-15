import BountyModal from 'components/bounties/BountyModal';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';

import BountyService from './BountyService';

interface IBountyEditorInput {
  onSubmit: () => any
}

export function BountyEditor ({ onSubmit }: IBountyEditorInput) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  function createBounty () {
    console.log('Bounty data');
  }

  return (
    <div>
      <h1>Bounty Editor</h1>

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

          <Grid item>
            <Grid container direction='row' alignItems='center'>
              <Grid item xs={6}>
                <Typography>Status</Typography>
              </Grid>
              <Grid item xs={6}>
                <Select
                  labelId='select-type'
                  id='select-type'
                  variant='standard'
                  label='type'
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

          <Grid item>
            EDITOR SECTION
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
                  <InputSearchCrypto defaultValue='ETH' onChange={() => {}} />
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
                Set bounty
              </PrimaryButton>
            </Box>
          </Grid>
        </Grid>

      </form>
    </div>
  );
}
