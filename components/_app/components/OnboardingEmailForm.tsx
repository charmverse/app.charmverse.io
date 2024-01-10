import { yupResolver } from '@hookform/resolvers/yup';
import { Checkbox, FormControlLabel, FormGroup, TextField, Typography, Stack, Tooltip } from '@mui/material';
import type { ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useSaveOnboardingEmail } from 'charmClient/hooks/profile';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { useUser } from 'hooks/useUser';

const emailSchema = yup.string().email().ensure().trim();

export const schema = yup.object({
  email: emailSchema.when(['emailNewsletter', 'emailNotifications'], {
    is: (emailNewsletter: boolean, emailNotifications: boolean) => emailNewsletter || emailNotifications,
    then: () => emailSchema.required('Unselect email options to proceed without email'),
    otherwise: () => emailSchema
  }),
  emailNotifications: yup.boolean(),
  emailNewsletter: yup.boolean(),
  agreeTermsConditions: yup.boolean().oneOf([true], 'You must agree to the terms and privacy policy to continue')
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
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || '',
      emailNotifications: true,
      agreeTermsConditions: false
    },
    // mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const emailNewsletter = getValues('emailNewsletter');
  const emailNotifications = getValues('emailNotifications');
  const agreeTermsConditions = getValues('agreeTermsConditions');

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
            control={
              <Checkbox
                data-test='member-email-notifications'
                {...register('emailNotifications')}
                checked={emailNotifications}
                onChange={onChange}
              />
            }
            label='Notify me about key activities (e.g., proposal feedback, reward status, mentions, comments)'
          />
          <FormControlLabel
            control={<Checkbox {...register('emailNewsletter')} checked={emailNewsletter} onChange={onChange} />}
            label="Keep me up to date on what's new with CharmVerse."
          />
          <FormControlLabel
            control={
              <Checkbox
                data-test='member-terms-conditions'
                {...register('agreeTermsConditions')}
                checked={agreeTermsConditions}
                onChange={onChange}
              />
            }
            label={
              <Typography>
                I agree to the{' '}
                <Link target='_blank' external href='https://www.charmverse.io/terms'>
                  Terms & Conditions
                </Link>
              </Typography>
            }
          />
        </FormGroup>
        <Stack flexDirection='row' gap={1} justifyContent='flex-end'>
          <Tooltip title={!agreeTermsConditions ? 'You must agree to the terms and conditions to continue' : ''}>
            <div>
              <Button loading={isMutating} data-test='member-email-next' type='submit' disabled={!isValid}>
                Next
              </Button>
            </div>
          </Tooltip>
        </Stack>
      </Stack>
    </form>
  );
}
