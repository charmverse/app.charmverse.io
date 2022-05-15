import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/common/form/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { FormValues, schema } from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import charmClient from 'charmClient';
import { Box, Typography } from '@mui/material';
import ImportNotionWorkspace from 'components/settings/workspace/ImportNotionWorkspace';
import Link from 'components/common/Link';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';
import ConnectSnapshot from 'components/common/PageLayout/components/Header/snapshot/ConnectSnapshot';

export default function WorkspaceSettings () {
  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
  const [spaces] = useSpaces();
  const [user] = useUser();

  const isAdmin = isSpaceAdmin(user, space?.id);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');

  async function onSubmit (values: FormValues) {
    if (!space || !isAdmin) return;
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
    if (isAdmin && space && window.confirm('Are you sure you want to delete your workspace? This action cannot be undone')) {
      await charmClient.deleteSpace(space.id);
      const nextSpace = spaces.filter(s => s.id !== space.id)[0];
      window.location.href = nextSpace ? `/${nextSpace.domain}` : '/';
    }
  }

  return (
    <>
      <Legend>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Avatar
              name={watchName}
              variant='rounded'
              spaceImage={watchSpaceImage}
              updateImage={(url: string) => setValue('spaceImage', url, { shouldDirty: true })}
            />
            <TextField
              {...register('spaceImage')}
              sx={{ visibility: 'hidden', width: '0px' }}
            />
          </Grid>
          <Grid item>
            <FieldLabel>Name</FieldLabel>
            <TextField
              {...register('name')}
              disabled={!isAdmin}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item>
            <FieldLabel>Domain</FieldLabel>
            <TextField
              {...register('domain')}
              disabled={!isAdmin}
              fullWidth
              error={!!errors.domain}
              helperText={errors.domain?.message}
            />
          </Grid>
          {isAdmin && (
            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton disabled={!isDirty} type='submit'>
                Save
              </PrimaryButton>
              <Button variant='outlined' color='error' onClick={deleteWorkspace}>
                Delete Workspace
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
      <Legend>API Key</Legend>
      <Typography variant='body1'>
        Request access to the charmverse API in our
        {' '}
        <Link href='https://discord.gg/ACYCzBGC2M' external target='_blank'>
          Discord Channel <LaunchIcon fontSize='small' />
        </Link>
      </Typography>

      <Legend>Import Content</Legend>
      <Box sx={{ ml: 1 }} display='flex' flexDirection='column' gap={1}>
        <ImportNotionWorkspace />
      </Box>

      <Legend>Snapshot.org Integration</Legend>
      <Box sx={{ ml: 1 }} display='flex' flexDirection='column' gap={1}>
        <ConnectSnapshot />
      </Box>
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
