'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';

import { actionOnboarding } from 'lib/profile/onboardingAction';

import { WelcomeButton } from './components/WelcomeButton';
import type { FormValues } from './utils/form';
import { schema } from './utils/form';

const defaultValues = { email: '', emailOption: 'notify' };

export function ExtraDetails() {
  const [state, formAction] = useFormState(actionOnboarding, defaultValues);

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
    <form action={actionOnboarding} onSubmit={(elem) => handleSubmit(() => elem.currentTarget.submit())}>
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
