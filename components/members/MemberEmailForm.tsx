import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox, FormControlLabel, FormGroup, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';

export const schema = yup.object({
  email: yup.string().ensure().trim().email(),
  emailNotifications: yup.boolean(),
  emailNewsletter: yup.boolean()
});

export type FormValues = yup.InferType<typeof schema>;

export function MemberEmailForm({ onClick }: { onClick: VoidFunction }) {
  const { updateUser, user } = useUser();

  const {
    register,
    trigger,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || '',
      emailNewsletter: false,
      emailNotifications: false
    },
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const email = getValues('email');
  const emailNewsletter = getValues('emailNewsletter');
  const emailNotifications = getValues('emailNotifications');

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    await trigger();
  };

  const onSave = async () => {
    const validate = await trigger();

    if (validate) {
      await charmClient.updateUser({
        email,
        emailNewsletter,
        emailNotifications
      });
      updateUser({ ...user, email, emailNewsletter, emailNotifications });
    }
  };

  return (
    <Stack gap={1}>
      <Typography>
        CharmVerse can use your email address to let you know when there is a conversation or activity you should be
        part of.
      </Typography>
      <TextField
        {...register('email')}
        data-test='member-email-input'
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
        placeholder='me@gmail.com'
        onChange={onChange}
      />
      <FormGroup>
        <FormControlLabel
          disabled={!!errors.email || email.length === 0}
          control={<Checkbox {...register('emailNotifications')} checked={emailNotifications} onChange={onChange} />}
          label='Receive email updates on mentions, comments, post and other things.'
        />
        <FormControlLabel
          disabled={!!errors.email || email.length === 0}
          control={<Checkbox {...register('emailNewsletter')} checked={emailNewsletter} onChange={onChange} />}
          label='Keep me up to date on whats new with CharmVerse.'
        />
      </FormGroup>
      <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
        <Button onClick={onClick} variant='outlined' color='secondary'>
          Skip
        </Button>
        <Button
          data-test='member-email-next'
          disabled={Object.keys(errors).length !== 0}
          onClick={() => {
            onSave();
            onClick();
          }}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
