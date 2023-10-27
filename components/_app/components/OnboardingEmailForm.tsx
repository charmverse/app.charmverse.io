import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox, FormControlLabel, FormGroup, TextField, Typography, Stack } from '@mui/material';
import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useSaveOnboardingEmail } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import { useUser } from 'hooks/useUser';

export const schema = yup.object({
  email: yup
    .string()
    .ensure()
    .trim()
    .email()
    .when('emailNewsletter', {
      is: true,
      then: yup.string().required('Unselect email options to proceed without email')
    })
    .when('emailNotifications', {
      is: true,
      then: yup.string().required('Unselect email options to proceed without email')
    }),
  emailNotifications: yup.boolean(),
  emailNewsletter: yup.boolean()
});

export type FormValues = yup.InferType<typeof schema>;

export function OnboardingEmailForm({ onClick, spaceId }: { onClick: VoidFunction; spaceId: string }) {
  const { trigger: saveForm, isMutating } = useSaveOnboardingEmail();
  const { updateUser, user } = useUser();

  const {
    register,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || '',
      emailNewsletter: !!user?.emailNewsletter,
      emailNotifications: true
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const emailNewsletter = getValues('emailNewsletter');
  const emailNotifications = getValues('emailNotifications');

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    return trigger();
  };

  const onSubmit = async (values: FormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { email, emailNewsletter, emailNotifications } = values;
    await saveForm({
      email: email || undefined,
      emailNewsletter,
      emailNotifications,
      spaceId
    });
    updateUser({ ...user, email, emailNewsletter, emailNotifications });
    onClick();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={2}>
        <Typography>
          CharmVerse can use your email address to let you know when there is a conversation or activity you should be
          part of.
        </Typography>
        <TextField
          {...register('email')}
          autoFocus
          data-test='member-email-input'
          error={!!errors.email}
          helperText={errors.email?.message}
          placeholder='me@gmail.com'
          onChange={onChange}
        />
        <FormGroup>
          <FormControlLabel
            control={<Checkbox {...register('emailNotifications')} checked={emailNotifications} onChange={onChange} />}
            label='Notify me about key activities (e.g., proposal feedback, reward status, mentions, comments)'
          />
          <FormControlLabel
            control={<Checkbox {...register('emailNewsletter')} checked={emailNewsletter} onChange={onChange} />}
            label="Keep me up to date on what's new with CharmVerse."
          />
        </FormGroup>
        <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
          <Button
            loading={isMutating}
            data-test='member-email-next'
            type='submit'
            disabled={Object.keys(errors).length !== 0}
          >
            Next
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
