import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import debounce from 'lib/utilities/debounce';

export const schema = yup.object({
  email: yup.string().ensure().trim().email().max(50)
});

export type FormValues = yup.InferType<typeof schema>;

export function MemberEmailForm({ readOnly = false }: { readOnly?: boolean }) {
  const { user, setUser } = useUser();

  const {
    register,
    trigger,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || ''
    },
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const onSave = useCallback(
    debounce(async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!readOnly) {
        const emailValue = event.target.value;
        const validate = await trigger();

        if (validate) {
          await charmClient.updateUser({
            email: emailValue
          });
          setUser({ ...user, email: emailValue });
        }
      }
    }, 300),
    [readOnly]
  );

  return (
    <Box mt={2}>
      <Typography fontWeight='bold'>Email</Typography>
      <Typography variant='subtitle2' mb={1}>
        CharmVerse can use your email address to let you know when there is a conversation or activity you should be
        part of.
      </Typography>
      <TextField
        {...register('email')}
        disabled={readOnly}
        data-testid='edit-email'
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
        placeholder=''
        onChange={async (event) => {
          const val = event.target.value;
          setValue('email', val);
          await onSave(event);
        }}
      />
    </Box>
  );
}
