import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { FormValues, schema } from 'components/common/CreateSpaceForm';
import FieldLabel from 'components/common/form/FieldLabel';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ConnectSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/ConnectSnapshot';
import PrimaryButton from 'components/common/PrimaryButton';
import SettingsLayout from 'components/settings/Layout';
import Legend from 'components/settings/Legend';
import ImportNotionWorkspace from 'components/settings/workspace/ImportNotionWorkspace';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { setTitle } from 'hooks/usePageTitle';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

export default function WorkspaceSettings () {
  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
  const [spaces, setSpaces] = useSpaces();
  const { user } = useUser();
  const isAdmin = isSpaceAdmin(user, space?.id);
  const workspaceRemoveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-remove' });
  const workspaceLeaveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-leave' });
  const unsavedChangesModalState = usePopupState({ variant: 'popover', popupId: 'unsaved-changes' });
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

  function closeInviteLinkDeleteModal () {
    workspaceRemoveModalState.close();
  }

  async function deleteWorkspace () {
    workspaceRemoveModalState.open();
  }

  usePreventReload(isDirty);

  return (
    <>

      <Legend>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Avatar
              name={watchName}
              variant='rounded'
              image={watchSpaceImage}
              updateImage={(url: string) => setValue('spaceImage', url, { shouldDirty: true })}
              editable={isAdmin}
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
          {isAdmin ? (
            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton disabled={!isDirty} type='submit'>
                Save
              </PrimaryButton>
              <Button variant='outlined' color='error' onClick={deleteWorkspace}>
                Delete Workspace
              </Button>
            </Grid>
          ) : (
            <Grid item display='flex'>
              <Button
                variant='outlined'
                color='error'
                onClick={() => {
                  workspaceLeaveModalState.open();
                }}
              >
                Leave Workspace
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
      {space && (
      <ConfirmDeleteModal
        title='Delete workspace'
        onClose={closeInviteLinkDeleteModal}
        open={workspaceRemoveModalState.isOpen}
        buttonText={`Delete ${space.name}`}
        question={`Are you sure you want to delete ${space.name}? This action cannot be undone`}
        onConfirm={async () => {
          if (isAdmin) {
            await charmClient.deleteSpace(space.id);
            const filteredSpaces = spaces.filter(s => s.id !== space.id);
            setSpaces(filteredSpaces);
            window.location.href = filteredSpaces.length !== 0 ? `/${filteredSpaces[0].domain}` : '/signup';
          }
        }}
      />
      )}
      {space && (
      <ConfirmDeleteModal
        title='Leave workspace'
        onClose={() => {
          workspaceLeaveModalState.close();
        }}
        open={workspaceLeaveModalState.isOpen}
        buttonText={`Leave ${space.name}`}
        question={`Are you sure you want to leave ${space.name}?`}
        onConfirm={async () => {
          await charmClient.leaveSpace(space.id);
          const filteredSpaces = spaces.filter(s => s.id !== space.id);
          setSpaces(filteredSpaces);
          window.location.href = filteredSpaces.length !== 0 ? `/${filteredSpaces[0].domain}` : '/signup';
        }}
      />
      )}
      <ConfirmDeleteModal
        open={unsavedChangesModalState.isOpen}
        title='You have unsaved changes'
        onClose={() => {
          // discard
          unsavedChangesModalState.close();
        }}
        buttonText='Save changes'
        question='Are you sure you want to discard unsaved changes'
        onConfirm={() => {
          // save
          unsavedChangesModalState.close();
        }}
      />
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
