import type { Space, Feature } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormControlLabel, Grid, Stack, Switch, Typography, TextField } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { getDefaultWorkspaceUrl } from 'components/login/LoginPage';
import Legend from 'components/settings/Legend';
import { SetupCustomDomain } from 'components/settings/space/components/SetupCustomDomain';
import { SpaceIntegrations } from 'components/settings/space/components/SpaceIntegrations';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import { getSpaceUrl, getSubdomainPath } from 'lib/utilities/browser';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';
import { typedKeys } from 'lib/utilities/objects';

import Avatar from './components/LargeAvatar';

const schema = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(true),
  show_bounties: yup.boolean(),
  show_forum: yup.boolean(),
  show_member_directory: yup.boolean(),
  show_proposals: yup.boolean(),
  notifyNewProposals: yup.boolean(),
  domain: yup
    .string()
    .ensure()
    .trim()
    .min(3, 'Domain must be at least 3 characters')
    .matches(/^[^!?@#$%^&*+=<>(){}.'"\\[\]|~/]*$/, 'The symbols you entered are not allowed')
    .matches(/^\S*$/, 'Space is not allowed')
});

type FormValues = yup.InferType<typeof schema>;

const featureLabels: Record<Feature, string> = {
  bounties: 'Bounties',
  forum: 'Forum',
  member_directory: 'Member Directory',
  proposals: 'Proposals'
};

export function SpaceSettings({ space }: { space: Space }) {
  const router = useRouter();
  const { spaces, setSpace, setSpaces } = useSpaces();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const workspaceRemoveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-remove' });
  const workspaceLeaveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-leave' });
  const unsavedChangesModalState = usePopupState({ variant: 'popover', popupId: 'unsaved-changes' });
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: _getFormValues(space),
    resolver: yupResolver(schema)
  });

  // set default values when space is set
  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space.id, type: 'settings' });
  }, [space.id]);

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');

  function onSubmit(values: FormValues) {
    if (!isAdmin || !values.domain) return;
    setError(null);
    // console.log(values);
    // console.log('space', space);
    // // return;

    const hiddenFeatures = typedKeys(featureLabels).reduce<Feature[]>((acc, key) => {
      if (!values[`show_${key}`]) {
        acc.push(key as Feature);
      }
      return acc;
    }, []);

    let notifyNewProposals: Date | null | undefined;
    if (!values.notifyNewProposals) {
      notifyNewProposals = null;
    } else if (!space.notifyNewProposals) {
      notifyNewProposals = new Date();
    }

    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    charmClient.spaces
      .updateSpace({
        id: space.id,
        notifyNewProposals,
        hiddenFeatures,
        name: values.name,
        domain: values.domain,
        spaceImage: values.spaceImage
      })
      .then((updatedSpace) => {
        if (newDomain) {
          // add a delay so that the form resets and doesnt block user from reloading due to calling usePreventReload(isDirty)
          setTimeout(() => {
            const subdomain = getValidSubdomain();
            if (subdomain) {
              window.location.href = `${getSpaceUrl({ domain: values.domain })}${getSubdomainPath(router.asPath)}`;
            } else {
              window.location.href = router.asPath.replace(space.domain, values.domain as string);
            }
          }, 100);
        } else {
          setSpace(updatedSpace);
          reset(_getFormValues(updatedSpace));
        }
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

  usePreventReload(isDirty);

  return (
    <>
      <Legend marginTop={0}>Space Settings</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Stack direction={['column', 'row']} gap={3}>
              <Stack pt={0.5}>
                <Avatar
                  name={watchName}
                  variant='rounded'
                  image={watchSpaceImage}
                  updateImage={(url: string) => setValue('spaceImage', url, { shouldDirty: true })}
                  editable={isAdmin}
                />
                <TextField {...register('spaceImage')} sx={{ visibility: 'hidden', width: '0px', height: '0px' }} />
              </Stack>

              <Stack flex={1} gap={1.5}>
                <Stack>
                  <FieldLabel>Name</FieldLabel>
                  <TextField
                    {...register('name')}
                    disabled={!isAdmin}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    data-test='space-name-input'
                  />
                </Stack>
                <Stack>
                  <FieldLabel>Domain</FieldLabel>
                  <TextField
                    {...register('domain')}
                    disabled={!isAdmin}
                    fullWidth
                    error={!!errors.domain}
                    helperText={errors.domain?.message}
                    sx={{ mb: 1 }}
                    data-test='space-domain-input'
                  />
                  {error && <FormHelperText error>{error}</FormHelperText>}
                </Stack>
              </Stack>
            </Stack>
          </Grid>

          <Grid item>
            <FieldLabel>Notifications</FieldLabel>
            <Typography variant='caption'>Control space-wide notifications for your members.</Typography>
            <Stack>
              <Controller
                control={control}
                name='notifyNewProposals'
                render={({ field: { onChange, value, name, ref } }) => {
                  return (
                    <FormControlLabel
                      control={
                        <Switch
                          disabled={!isAdmin}
                          checked={value}
                          onChange={(event, val) => {
                            if (val) {
                              setValue(`notifyNewProposals`, val);
                            }
                            return onChange(val);
                          }}
                        />
                      }
                      label='Send notifications for new proposals'
                    />
                  );
                }}
              />
            </Stack>
          </Grid>
          <Grid item>
            <FieldLabel>Sidebar Module Visibility</FieldLabel>
            <Typography variant='caption'>
              Turn on and off the visibility of the following modules in the sidebar. The functionality will still
              exist, but it won't be visible in the sidebar.
            </Typography>
            <Stack>
              {typedKeys(featureLabels).map((feature) => (
                <Controller
                  key={feature}
                  control={control}
                  name={`show_${feature}`}
                  render={({ field: { onChange, value, name, ref } }) => {
                    return (
                      <FormControlLabel
                        control={
                          <Switch
                            data-test={`space-feature-toggle-${feature}`}
                            disabled={!isAdmin}
                            checked={value}
                            onChange={(event, val) => {
                              if (val) {
                                setValue(`show_${feature}`, val);
                              }
                              return onChange(val);
                            }}
                          />
                        }
                        label={featureLabels[feature]}
                      />
                    );
                  }}
                />
              ))}
            </Stack>
          </Grid>
          {isAdmin ? (
            <Grid item display='flex' justifyContent='space-between'>
              <Button disableElevation size='large' data-test='submit-space-update' disabled={!isDirty} type='submit'>
                Save
              </Button>
              <Button variant='outlined' color='error' onClick={deleteWorkspace} data-test='submit-space-delete'>
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

      <SetupCustomDomain space={space} />

      <SpaceIntegrations />

      {space && (
        <ConfirmDeleteModal
          title='Delete space'
          onClose={closeInviteLinkDeleteModal}
          open={workspaceRemoveModalState.isOpen}
          buttonText={`Delete ${space.name}`}
          question={`Are you sure you want to delete ${space.name}? This action cannot be undone`}
          onConfirm={async () => {
            if (isAdmin) {
              await charmClient.spaces.deleteSpace(space.id);
              const filteredSpaces = spaces.filter((s) => s.id !== space.id);
              // redirect user to the next space if they have one
              if (filteredSpaces.length > 0) {
                await router.push(getDefaultWorkspaceUrl(filteredSpaces));
              } else {
                await router.push('/createSpace');
              }
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
            await charmClient.spaces.leaveSpace(space.id);
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

function _getFormValues(space: Space): FormValues {
  return {
    name: space.name,
    spaceImage: space.spaceImage,
    domain: space.domain,
    notifyNewProposals: !!space.notifyNewProposals,
    show_bounties: !space.hiddenFeatures.includes('bounties'),
    show_forum: !space.hiddenFeatures.includes('forum'),
    show_member_directory: !space.hiddenFeatures.includes('member_directory'),
    show_proposals: !space.hiddenFeatures.includes('proposals')
  };
}
