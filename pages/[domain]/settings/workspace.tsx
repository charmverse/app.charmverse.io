import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'components/common/page-layout/PageTitle';

interface FormValues {
  domain: string;
  name: string;
}

export default function WorkspaceSettings () {

  setTitle('Workspace Options');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: 'CharmVerse'
    }
  });

  const watchName = watch('name');

  function onSubmit (values: FormValues) {
    alert(values.domain)
  }

  return (<>
    <Legend>Space Details</Legend>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container direction={'column'} spacing={3}>
        <Grid item>
          <Avatar name={watchName} variant='rounded' />
        </Grid>
        <Grid item>
          <FieldLabel>Name</FieldLabel>
          <TextField
            {...register('name', { required: true })}
            fullWidth
            error={!!errors.name}
            helperText={errors.name && 'Name is required'}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Domain</FieldLabel>
          <TextField
            {...register('domain', { required: true })}
            fullWidth
            error={!!errors.domain}
            helperText={errors.domain && 'Domain is required'}
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

WorkspaceSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};