'use client';

import { log } from '@charmverse/core/log';
import { FormErrors } from '@connect-shared/components/common/FormErrors';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Stack,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { useUser } from '@packages/scoutgame/components/layout/UserProvider';
import { useIsMounted } from '@packages/scoutgame/hooks/useIsMounted';
import { concatenateStringValues } from '@root/lib/utils/strings';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';

import { saveOnboardingDetailsAction } from 'lib/onboarding/saveOnboardingDetailsAction';
import type { SaveOnboardingDetailsFormValues } from 'lib/onboarding/saveOnboardingDetailsSchema';
import { saveOnboardingDetailsSchema } from 'lib/onboarding/saveOnboardingDetailsSchema';

export function OnboardingForm() {
  const router = useRouter();
  const { refreshUser, user } = useUser();
  const [errors, setErrors] = useState<string[] | null>(null);

  const { execute, isExecuting } = useAction(saveOnboardingDetailsAction, {
    async onSuccess() {
      await refreshUser();
      router.push('/how-it-works');
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

  const { control, getValues, handleSubmit } = useForm<SaveOnboardingDetailsFormValues>({
    resolver: yupResolver(saveOnboardingDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      agreedToTOS: false,
      sendMarketing: true
    }
  });

  const onSubmit = (data: SaveOnboardingDetailsFormValues) => {
    execute(data);
  };

  function onInvalid(fieldErrors: FieldErrors) {
    setErrors(['The form is invalid. Please check the fields and try again.']);
    log.warn('Invalid form submission', { fieldErrors, values: getValues() });
  }

  const isMounted = useIsMounted();

  // We are using the mounted flag here because the default form state is different from the client
  if (!isMounted) {
    return null;
  }

  const avatarSize = 65;

  return (
    <Box display='flex' gap={3} flexDirection='column' alignItems='flex-start' data-test='welcome-page'>
      <Stack>
        <Typography variant='h5' color='text.secondary'>
          Profile
        </Typography>
        <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack
              display='flex'
              gap={2}
              alignItems='center'
              flexDirection='row'
              my={1}
              p={{
                xs: 1,
                md: 2
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: avatarSize,
                  minWidth: avatarSize,
                  height: avatarSize,
                  minHeight: avatarSize,
                  borderRadius: '50%',
                  backgroundColor: 'inputBackground.main'
                }}
              >
                <Image
                  src={user?.avatar ?? ''}
                  alt='avatar'
                  width={avatarSize}
                  height={avatarSize}
                  sizes='100vw'
                  style={{
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              </Box>
              <Typography variant='h5'>{user?.displayName}</Typography>
            </Stack>
            <FormLabel id='form-email' required>
              Email
            </FormLabel>
            <Controller
              control={control}
              name='email'
              render={({ field, fieldState: { error } }) => (
                <TextField
                  data-test='onboarding-email'
                  placeholder='Your email'
                  autoFocus
                  aria-labelledby='form-email'
                  required
                  type='email'
                  error={!!error?.message}
                  {...field}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Controller
              control={control}
              name='sendMarketing'
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  control={<Checkbox data-test='onboarding-notify-grants' onChange={onChange} checked={!!value} />}
                  label={
                    <Typography variant='body2'>Notify me of new opportunities (grants, accelerators, etc)</Typography>
                  }
                  sx={{ fontSize: 12 }}
                />
              )}
            />
            <Controller
              control={control}
              name='agreedToTOS'
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  control={<Checkbox data-test='onboarding-accept-terms' onChange={onChange} checked={!!value} />}
                  label={
                    <Typography variant='body2'>
                      I agree to the
                      <Link href='/info/terms' target='_blank'>
                        {' '}
                        Terms and Service
                      </Link>
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
              )}
            />
          </FormControl>
          <Stack display='flex' alignItems='center' gap={1} width='100%'>
            <Button
              data-test='submit-extra-details'
              size='medium'
              type='submit'
              disabled={isExecuting}
              fullWidth
              sx={{ flexShrink: 0, py: 1, px: 2 }}
            >
              Next
            </Button>
            <FormErrors errors={errors} />
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
