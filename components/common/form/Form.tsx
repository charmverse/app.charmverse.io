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
import { PageContent } from 'models';

import BangleEditor from 'components/editor/BangleEditor';
import { useRef } from 'react';
import { GenericInput, IInputField } from './GenericInput';

type FormMode = 'create' | 'update';

export interface ICompositeFormInput<T = any> {
  onSubmit: (values: T) => any
  fields: IInputField [],
  mode?: FormMode
  submitLabel?: string
}

export function CompositeForm ({ onSubmit, fields, mode, submitLabel }: ICompositeFormInput) {

  const renders = useRef(0);

  renders.current += 1;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  const formValue = watch();

  function submitForm (values) {
    console.log('Values', values);
  }

  return (

    <>
      <p>
        Renders
        {' '}
        {renders.current}
      </p>

      <form onSubmit={handleSubmit(submitForm)}>

        {
        fields.map(field => {
          return <GenericInput key={field.modelKey as string} register={register} fieldConfig={field} />;
        })
      }

        <PrimaryButton type='submit'>
          {submitLabel ?? (mode === 'update' ? 'Update' : 'Create')}
        </PrimaryButton>

        {/*
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
          <BangleEditor />
        </Grid>

        <Grid item>
          <Box display='flex' justifyContent='flex-end'>
            <PrimaryButton type='submit'>
              Set bounty
            </PrimaryButton>
          </Box>

        </Grid>
      </Grid>

      */
    }

      </form>
    </>
  );

}
