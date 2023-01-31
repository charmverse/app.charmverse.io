import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, FormHelperText, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ConnectSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/ConnectSnapshot';
import PrimaryButton from 'components/common/PrimaryButton';
import SettingsLayout from 'components/settings/Layout';
import Legend from 'components/settings/Legend';
import ImportNotionWorkspace from 'components/settings/workspace/ImportNotionWorkspace';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { charmverseDiscordInvite } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { setTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

const schema = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(true),
  domain: yup.string()
});

type FormValues = yup.InferType<typeof schema>;

export default function WorkspaceSettings() {
  const router = useRouter();
  const space = useCurrentSpace();
  const { spaces, setSpace, setSpaces } = useSpaces();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space?.id, type: 'settings' });
  }, []);

  // set default values when space is set
  useEffect(() => {
    if (space) {
      reset(space);
    }
  }, [space?.id]);

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');

  function onSubmit(values: FormValues) {
    if (!space || !isAdmin || !values.domain) return;
    setError(null);
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    charmClient
      .updateSpace({ ...space, name: values.name, domain: values.domain, spaceImage: values.spaceImage })
      .then((updatedSpace) => {
        if (newDomain) {
          // add a delay so that the form resets
          setTimeout(() => {
            window.location.href = router.asPath.replace(space.domain, values.domain as string);
          }, 100);
        } else {
          setSpace(updatedSpace);
        }
        reset(updatedSpace);
      })
      .catch((err) => {
        setError(err?.message || err || 'Something went wrong');
      });
  }

  function closeInviteLinkDeleteModal() {
    workspaceRemoveModalState.close();
  }

  async function deleteWorkspace() {
    workspaceRemoveModalState.open();
  }

  setTitle('Space Options');
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
            <TextField {...register('spaceImage')} sx={{ visibility: 'hidden', width: '0px' }} />
          </Grid>
          <Grid item>
            <FieldLabel>Name</FieldLabel>
            <TextField
              {...register('name')}
              disabled={!isAdmin}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              data-test='set-space-name'
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
              sx={{ mb: 1 }}
              data-test='set-space-domain'
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Grid>
          {isAdmin ? (
            <Grid item display='flex' justifyContent='space-between'>
              <PrimaryButton data-test='submit-space-update' disabled={!isDirty} type='submit'>
                Save
              </PrimaryButton>
              <Button variant='outlined' color='error' onClick={deleteWorkspace}>
                Delete Space
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
                Leave Space
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
      <Legend>API Key</Legend>
      <Typography variant='body1'>
        Request access to the charmverse API in our{' '}
        <Link href={charmverseDiscordInvite} external target='_blank'>
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
          title='Delete space'
          onClose={closeInviteLinkDeleteModal}
          open={workspaceRemoveModalState.isOpen}
          buttonText={`Delete ${space.name}`}
          question={`Are you sure you want to delete ${space.name}? This action cannot be undone`}
          onConfirm={async () => {
            if (isAdmin) {
              await charmClient.deleteSpace(space.id);
              const filteredSpaces = spaces.filter((s) => s.id !== space.id);
              setSpaces(filteredSpaces);
            }
          }}
        />
      )}
      {space && (
        <ConfirmDeleteModal
          title='Leave space'
          onClose={() => {
            workspaceLeaveModalState.close();
          }}
          open={workspaceLeaveModalState.isOpen}
          buttonText={`Leave ${space.name}`}
          question={`Are you sure you want to leave ${space.name}?`}
          onConfirm={async () => {
            await charmClient.leaveSpace(space.id);
            const filteredSpaces = spaces.filter((s) => s.id !== space.id);
            setSpaces(filteredSpaces);
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
  return <SettingsLayout>{page}</SettingsLayout>;
};
