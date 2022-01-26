import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Avatar from 'components/settings/LargeAvatar';

interface FormValues {
  username: string;
}

export default function AccountSettings () {

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: 'Dolemite'
    }
  });

  const watchUsername = watch('username');

  function onSubmit (values: FormValues) {
    alert(values.username)
  }

  return (<>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ py: 3 }}>
        <Avatar name={watchUsername} />
      </Box>
      <Grid container direction={"column"} spacing={3}>
        <Grid item>
          <FieldLabel>Username</FieldLabel>
          <TextField
            {...register('username', { required: true })}
            fullWidth
            error={!!errors.username}
            helperText={errors.username && 'Username is required'}
          />
        </Grid>
        <Grid item>
          <PrimaryButton type='submit'>
            Save
          </PrimaryButton>
        </Grid>
      </Grid>
    </form>
  </>);

}

AccountSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};