'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';

import { onboardingAction } from 'lib/profile/onboardingAction';

import type { FormValues } from './utils/form';
import { schema } from './utils/form';

const defaultValues = { wallet: '', email: '', emailOption: 'notify' };

export function ExtraDetails() {
  const [viewWalletField, setViewWalletField] = useState(false);

  const [state, formAction] = useFormState(onboardingAction, defaultValues);

  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    setValue
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return (
    <form action='/api/dsada'>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box display='flex'>
          <Typography>Wallet: 0x123...123</Typography>
          <Button variant='text' sx={{ p: 0, m: 0 }} onClick={() => setViewWalletField((prevState) => !prevState)}>
            {viewWalletField ? 'Cancel' : 'Change'}
          </Button>
        </Box>
        {viewWalletField && (
          <Box display='flex' flexDirection='column' gap={1}>
            <FormLabel>New Wallet</FormLabel>
            <Controller
              control={control}
              name='wallet'
              render={({ field }) => <TextField {...field} error={!!errors.wallet} />}
            />
          </Box>
        )}
        <Box>
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
        </Box>
        <Button sx={{ mb: 4 }} type='submit' disabled={!isValid}>
          Next
        </Button>
      </Box>
    </form>
  );
}
