'use client';

import { log } from '@charmverse/core/log';
import { FormErrors } from '@connect-shared/components/common/FormErrors';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Stack,
  TextField
} from '@mui/material';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { saveTermsOfServiceAction } from 'lib/users/saveTermsOfServiceAction';
import { schema } from 'lib/users/termsOfServiceSchema';
import type { FormValues } from 'lib/users/termsOfServiceSchema';

export function ExtraDetailsForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[] | null>(null);

  const { execute, isExecuting } = useAction(saveTermsOfServiceAction, {
    onSuccess() {
      router.push('/welcome/builder');
    },
    onError(err) {
      const hasValidationErrors = err.error.validationErrors?.fieldErrors;
      const errorMessage = hasValidationErrors
        ? concatenateStringValues(err.error.validationErrors!.fieldErrors)
        : err.error.serverError?.message || 'Something went wrong';

      setErrors(errorMessage instanceof Array ? errorMessage : [errorMessage]);
      log.error('Error saving extra user details', { error: err });
    }
  });

  const { control, getValues, handleSubmit } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', agreedToTOS: false, sendMarketing: true }
  });

  const onSubmit = (data: FormValues) => {
    execute(data);
  };

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
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
              sx={{ mb: 2.5 }}
            />
          )}
        />
        <Controller
          control={control}
          name='sendMarketing'
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={<Checkbox data-test='onboarding-notify-grants' onChange={onChange} checked={!!value} />}
              label='Notify me of new opportunities (grants, accelerators, etc)'
              sx={{ mb: 1.5 }}
            />
          )}
        />
        <Controller
          control={control}
          name='agreedToTOS'
          render={({ field: { onChange, value } }) => (
            <FormControlLabel
              control={<Checkbox data-test='onboarding-accept-terms' onChange={onChange} checked={!!value} />}
              label='Terms and Service'
              sx={{ mb: 1.5 }}
            />
          )}
        />
      </FormControl>
      <Stack display='flex' alignItems='center' gap={1} width='100%'>
        {!isExecuting && errors?.length ? (
          <Box flexGrow={1}>
            <FormErrors errors={errors} />
          </Box>
        ) : (
          <Box flexGrow={1}></Box>
        )}
        <Button
          data-test='finish-onboarding'
          size='medium'
          type='submit'
          disabled={isExecuting}
          fullWidth
          sx={{ flexShrink: 0, py: 1, px: 2 }}
        >
          Next
        </Button>
      </Stack>
    </form>
  );
}
