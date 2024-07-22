'use client';

import { log } from '@charmverse/core/log';
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

import type { FormValues } from 'lib/profile/form';
import { schema } from 'lib/profile/form';
import { actionOnboarding } from 'lib/profile/onboardingAction';

const defaultValues = { email: '', terms: false, notify: true } as const;

export function ExtraDetails() {
  const router = useRouter();

  const { execute, result, isExecuting, hasErrored } = useAction(actionOnboarding, {
    onSuccess() {
      router.push('/profile');
    },
    onError(err: any) {
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

  const onSubmit = (data: FormValues) => {
    execute(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
        <FormLabel id='form-email'>Email</FormLabel>
        <Controller
          control={control}
          name='email'
          render={({ field, fieldState: { error } }) => (
            <TextField
              data-test='onboarding-email'
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
              control={<Checkbox data-test='onboarding-notify-grants' onChange={onChange} checked={!!value} />}
              label='Notify me of new opportunities (grants, accelerators, etc)'
            />
          )}
        />
        <Controller
          control={control}
          name='terms'
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={<Checkbox data-test='onboarding-accept-terms' onChange={onChange} checked={!!value} />}
              label='Terms and Service'
            />
          )}
        />
        {hasErrored && validationErrors?.length > 0 && (
          <FormHelperText error={hasErrored}>{validationError}</FormHelperText>
        )}
        <FormHelperText error={!!hasErrored}>{result.serverError?.message || result.fetchError}</FormHelperText>
      </FormControl>
      <Box display='flex' justifyContent='flex-end'>
        <Button data-test='finish-onboarding' size='large' type='submit' disabled={!isValid || isExecuting}>
          Next
        </Button>
      </Box>
    </form>
  );
}
