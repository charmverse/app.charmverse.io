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
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { FormValues, schema } from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import charmClient from 'charmClient';

export default function WorkspaceSettings () {

  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
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

  async function onSubmit (values: FormValues) {
    if (!space) return;
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    const updatedSpace = await charmClient.updateSpace({ ...space, ...values });
    if (newDomain) {
      window.location.href = router.asPath.replace(space.domain, values.domain);
    }
    else {
      setSpace(updatedSpace);
    }
    reset(updatedSpace);
  }

  async function deleteWorkspace () {
    if (space && window.confirm('Are you sure you want to delete your workspace? This action cannot be undone')) {
      await charmClient.deleteSpace(space!.id);
      const nextSpace = spaces.filter(s => s.id !== space.id)[0];
      console.log(nextSpace);
      window.location.href = nextSpace ? `/${nextSpace.domain}` : '/';
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
            <Button variant='outlined' color='error' onClick={deleteWorkspace}>
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
