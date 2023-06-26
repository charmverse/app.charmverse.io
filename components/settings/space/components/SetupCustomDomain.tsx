import type { Space } from '@charmverse/core/src/prisma-client';
import { InputAdornment, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Link from 'components/common/Link';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { isValidDomainName } from 'lib/utilities/domains/isValidDomainName';

const CNAME_INSTRUCTIONS_URL = 'https://app.charmverse.io/charmverse/page-7475001106586148';

type FormValues = {
  customDomain: string;
};

export function SetupCustomDomain({ space }: { space: Space }) {
  const { setSpace } = useSpaces();

  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: { customDomain: space.customDomain ?? '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      const res = await charmClient.spaces.updateCustomDomain({ spaceId: space.id, customDomain: values.customDomain });
      setSpace({ ...space, customDomain: res.customDomain || '' });

      showMessage('Custom domain updated', 'success');
      reset({ customDomain: res.customDomain || '' });
    } catch (err: any) {
      if (err.message) {
        setError('customDomain', { message: err.message });
      } else {
        showMessage('Failed to save custom domain', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack mt={3}>
      <FieldLabel>Custom space URL domain</FieldLabel>
      <Typography variant='caption' color='text.secondary' mb={1}>
        Add a custom domain you own to access your app thorugh it. You will be prompted with further instructions after
        saving.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack direction='row' alignItems='start' spacing={1}>
          <TextField
            {...register('customDomain', {
              validate: (value) => isValidDomainName(value) || 'Please provide valid domain name.'
            })}
            InputProps={{
              startAdornment: <InputAdornment position='start'>https://</InputAdornment>
            }}
            disabled={!isAdmin}
            fullWidth
            error={!!errors.customDomain}
            helperText={errors.customDomain?.message || ''}
            data-test='space-custom-domain-input'
            placeholder='dao.example.com'
          />

          <Button
            disableElevation
            data-test='submit-space-custom-domain'
            disabled={!isDirty || isSubmitting}
            type='submit'
            size='large'
          >
            Save domain
          </Button>
        </Stack>
      </form>

      <Typography variant='caption' mt={0.5}>
        You will need to point your domain to our app. You can find out on how to do that{' '}
        <Link href={CNAME_INSTRUCTIONS_URL} external target='_blank'>
          here
        </Link>
      </Typography>
    </Stack>
  );
}
