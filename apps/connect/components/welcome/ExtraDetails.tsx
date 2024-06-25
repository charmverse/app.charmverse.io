'use client';

import { actionOnboarding } from '@connect/lib/profile/onboardingAction';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

import type { FormValues } from './utils/form';
import { schema } from './utils/form';

const defaultValues = { email: '', terms: false, notify: true } as const;

export function ExtraDetails() {
  const { execute, executeAsync, result, status, reset, isIdle, isExecuting, hasSucceeded, hasErrored } =
    useAction(actionOnboarding);

  const {
    control,
    formState: { errors, isValid },
    handleSubmit
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(executeAsync)}>
      <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
        <FormLabel id='form-email'>Email</FormLabel>
        <Controller
          control={control}
          name='email'
          render={({ field }) => (
            <TextField aria-labelledby='form-email' error={!!errors.email} {...field} sx={{ mb: 1 }} />
          )}
        />
        <Controller
          control={control}
          name='notify'
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={<Checkbox onChange={onChange} checked={!!value} />}
              label='Notify me of new opportunities (grants, accelerators, etc)'
            />
          )}
        />
        <Controller
          control={control}
          name='terms'
          render={({ field: { onChange, value } }) => (
            <FormControlLabel control={<Checkbox onChange={onChange} checked={!!value} />} label='Terms and Service' />
          )}
        />
      </FormControl>
      <Button sx={{ mb: 4, my: 2 }} type='submit' disabled={!isValid || isExecuting}>
        Next
      </Button>
      <FormHelperText error={!!hasErrored}></FormHelperText>
    </form>
  );
}
