'use client';

import { log } from '@charmverse/core/log';
import { schema } from '@connect/lib/profile/form';
import type { FormValues } from '@connect/lib/profile/form';
import { actionOnboarding } from '@connect/lib/profile/onboardingAction';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  TextField
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

const defaultValues = { email: '', terms: false, notify: true } as const;

export function ExtraDetails() {
  const router = useRouter();
  // @ts-ignore
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
    formState: { isValid },
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
          render={({ field, fieldState: { error } }) => (
            <TextField
              placeholder='Your email'
              autoFocus
              aria-labelledby='form-email'
              type='email'
              error={!!error?.message}
              {...field}
              sx={{ mb: 1 }}
            />
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
      <Box display='flex' justifyContent='flex-end'>
        <Button size='large' type='submit' disabled={!isValid || isExecuting}>
          Next
        </Button>
      </Box>
    </form>
  );
}
