import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  username: yup.string().ensure().trim()
    .matches(/^[0-9a-zA-Z\s]*$/, 'Name must be only letters, numbers, and spaces')
    .required('Username is required')
});

type FormValues = yup.InferType<typeof schema>;

export default function AccountSettings () {

  setTitle('My Account');
  const [user, setUser] = useUser();

  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: user!,
    resolver: yupResolver(schema)
  });

  const watchUsername = watch('username');

  function onSubmit (values: FormValues) {
    setUser({ ...user, ...values });
    reset(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ py: 3 }}>
        <Avatar name={watchUsername} />
      </Box>
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <FieldLabel>Username</FieldLabel>
          <TextField
            {...register('username')}
            fullWidth
            error={!!errors.username}
            helperText={errors.username?.message}
          />
        </Grid>
        <Grid item>
          <PrimaryButton disabled={!isDirty} type='submit'>
            Save
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  );

}

AccountSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
