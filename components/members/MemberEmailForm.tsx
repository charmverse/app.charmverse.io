import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import debounce from 'lib/utilities/debounce';

export const schema = yup.object({
  email: yup.string().ensure().trim().email()
});

export type FormValues = yup.InferType<typeof schema>;

export function MemberEmailForm({ onClick, readOnly = false }: { onClick: VoidFunction; readOnly?: boolean }) {
  const { user, setUser } = useUser();

  const {
    register,
    trigger,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || ''
    },
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const onSave = useCallback(
    debounce(async (emailValue: string) => {
      if (!readOnly) {
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
    <Stack gap={1}>
      <Typography>
        CharmVerse can use your email address to let you know when there is a conversation or activity you should be
        part of.
      </Typography>
      <TextField
        {...register('email')}
        disabled={readOnly}
        data-test='member-email-input'
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
        placeholder='me@gmail.com'
        onChange={async (event) => {
          const val = event.target.value;
          setValue('email', val);
        }}
      />
      <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
        <Button onClick={onClick} variant='outlined' color='secondary'>
          Skip
        </Button>
        <Button
          data-test='member-email-next'
          onClick={() => {
            onSave(getValues('email'));
            onClick();
          }}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
