'use client';

import { log } from '@charmverse/core/log';
import { actionOnboarding } from '@connect/lib/profile/onboardingAction';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

import type { FormValues } from './utils/form';
import { schema } from './utils/form';

const defaultValues = { email: '', terms: false, notify: true } as const;

export function ExtraDetails() {
  const router = useRouter();
  const { executeAsync, result, isExecuting, hasErrored } = useAction(actionOnboarding, {
    onSuccess() {
      router.push('/profile');
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  const {
    control,
    formState: { errors, isValid },
    handleSubmit
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  const validationErrors =
    result.validationErrors?.fieldErrors?.email ||
    result.validationErrors?.fieldErrors.notify ||
    result.validationErrors?.fieldErrors.terms ||
    [];

  const validationError = validationErrors.map((err) => <span key={err}>{err}</span>);

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
        {hasErrored && validationErrors?.length > 0 && (
          <FormHelperText error={hasErrored}>{validationError}</FormHelperText>
        )}
        <FormHelperText error={!!hasErrored}>{result.serverError?.message || result.fetchError}</FormHelperText>
      </FormControl>
      <Button sx={{ mb: 4, my: 2 }} type='submit' disabled={!isValid || isExecuting}>
        Next
      </Button>
    </form>
  );
}
