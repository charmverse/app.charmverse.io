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
import { useSpace } from 'hooks/useSpace';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  domain: yup.string().ensure().trim().lowercase()
    .matches(/^[0-9a-z]*$/, 'Domain must be only lowercase letters and numbers')
    .required('Domain is required'),
  name: yup.string().ensure().trim()
    .matches(/^[0-9a-zA-Z\s]*$/, 'Name must be only letters, numbers, and spaces')
    .required('Name is required'),
});

type FormValues = yup.InferType<typeof schema>;

export default function WorkspaceSettings () {

  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useSpace();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema),
  });

  const watchName = watch('name');

  function onSubmit (values: FormValues) {
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    setSpace({ ...space, ...values }, newDomain);
    if (newDomain) {
      window.location.href = router.asPath.replace(space.domain, values.domain);
    }
    reset(values);
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
            {...register('name')}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid item>
          <FieldLabel>Domain</FieldLabel>
          <TextField
            {...register('domain', { required: true })}
            fullWidth
            error={!!errors.domain}
            helperText={errors.domain?.message}
          />
        </Grid>
        <Grid item>
          <PrimaryButton disabled={!isDirty} type='submit'>
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