import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'components/common/page-layout/PageTitle';
import { useSpace } from 'hooks/useSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export const schema = yup.object({
  domain: yup.string().ensure().trim().lowercase()
    .min(3, 'Domain must be at least 3 characters')
    .matches(/^[0-9a-z-]*$/, 'Domain must be only lowercase hyphens, letters, and numbers')
    .required('Domain is required'),
  name: yup.string().ensure().trim()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required')
});

export type FormValues = yup.InferType<typeof schema>;

export default function WorkspaceSettings () {

  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useSpace();
  const [spaces] = useSpaces();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema)
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

  function deleteWorkspace () {
    if (window.confirm('Are you sure you want to delete your workspace? This action cannot be undone')) {
      setSpace(null);
      window.location.href = `/${spaces[0].domain}`;
    }
  }

  return (
    <>
      <Legend>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
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
              {...register('domain')}
              fullWidth
              error={!!errors.domain}
              helperText={errors.domain?.message}
            />
          </Grid>
          <Grid item display='flex' justifyContent='space-between'>
            <PrimaryButton disabled={!isDirty} type='submit'>
              Save
            </PrimaryButton>
            <Button disabled={spaces.length === 1} variant='outlined' color='error' onClick={deleteWorkspace}>
              Delete Workspace
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );

}

WorkspaceSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
