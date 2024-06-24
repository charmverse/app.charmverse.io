'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

import { actionOnboarding } from 'lib/profile/onboardingAction';

import { WelcomeButton } from './components/WelcomeButton';
import type { FormValues } from './utils/form';
import { schema } from './utils/form';

const defaultValues = { email: '', emailOption: 'notify' } as const;

export function ExtraDetails() {
  const { execute, executeAsync, result, status, reset, isIdle, isExecuting, hasSucceeded, hasErrored } =
    useAction(actionOnboarding);

  // console.dir('worksss', { result, status, isIdle, isExecuting, hasSucceeded, hasErrored });

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    getValues
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit((data) => execute({ data }))}>
      <FormControl sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormLabel id='form-email'>Email</FormLabel>
        <Controller
          control={control}
          name='email'
          render={({ field }) => <TextField aria-labelledby='form-email' error={!!errors.email} {...field} />}
        />
        <Controller
          control={control}
          name='emailOption'
          render={({ field }) => (
            <RadioGroup aria-labelledby='form-email' {...field}>
              <FormControlLabel
                value='notify'
                control={<Radio />}
                label='Notify me of new opportunities (grants, accelerators, etc)'
              />
              <FormControlLabel value='terms' control={<Radio />} label='Terms and Service' />
            </RadioGroup>
          )}
        />
      </FormControl>
      <WelcomeButton sx={{ mb: 4 }} type='submit' disabled={!isValid}>
        Next
      </WelcomeButton>
    </form>
  );
}
