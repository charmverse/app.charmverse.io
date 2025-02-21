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
  Link,
  TextField
} from '@mui/material';
import { onboardingAction } from '@packages/connect-shared/lib/profile/onboardingAction';
import type { FormValues } from '@packages/profile/form';
import { schema } from '@packages/profile/form';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

const defaultValues = { email: '', terms: false, notify: true } as const;

export function ExtraDetails() {
  const router = useRouter();

  const { execute, result, isExecuting, hasErrored } = useAction(onboardingAction, {
    onSuccess() {
      router.push('/profile');
    },
    onError(err: any) {
      log.error('Error saving onboarding form', { error: err.error.serverError });
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
        <FormLabel>Email</FormLabel>
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
              error={!!error}
              helperText={error?.message}
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
              label={
                <>
                  I agree to the{' '}
                  <Link color='white' underline='hover' target='_blank' href='https://charmverse.io/terms/'>
                    Terms of Service
                  </Link>
                </>
              }
            />
          )}
        />
        {hasErrored && validationErrors?.length > 0 && (
          <FormHelperText error={hasErrored}>{validationError}</FormHelperText>
        )}
        <FormHelperText error={!!hasErrored}>{result.serverError?.message || result.fetchError}</FormHelperText>
      </FormControl>
      <Box display='flex' justifyContent='flex-end'>
        <Button data-test='finish-onboarding' size='large' type='submit' disabled={isExecuting}>
          Next
        </Button>
      </Box>
    </form>
  );
}
