import type { Space, IdentityType } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormHelperText, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import isEqual from 'lodash/isEqual';
import PopupState from 'material-ui-popup-state';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { DraggableListItem } from 'components/common/DraggableListItem';
import FieldLabel from 'components/common/form/FieldLabel';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { PageIcon } from 'components/common/PageIcon';
import Legend from 'components/settings/Legend';
import { SetupCustomDomain } from 'components/settings/space/components/SetupCustomDomain';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMemberProfileTypes } from 'hooks/useMemberProfileTypes';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useSpaces } from 'hooks/useSpaces';
import type { Feature } from 'lib/features/constants';
import type { NotificationToggleOption, NotificationToggles } from 'lib/notifications/notificationToggles';
import type { MemberProfileJson, MemberProfileName } from 'lib/profile/memberProfiles';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { getSpaceUrl, getSubdomainPath } from 'lib/utilities/browser';
import { getSpaceDomainFromHost } from 'lib/utilities/domains/getSpaceDomainFromHost';
import { isValidDomainName } from 'lib/utilities/domains/isValidDomainName';
import { isTruthy } from 'lib/utilities/types';

import { AddMoreMemberProfilesModal, getProfileWidgetLogo } from './components/AddMoreMemberProfilesModal';
import { ConnectCollabland } from './components/ConnectCollabland';
import Avatar from './components/LargeAvatar';
import { NotificationTogglesInput, getDefaultValues } from './components/NotificationToggles';
import { SettingsItem } from './components/SettingsItem';
import { SpacePrimaryIdentity } from './components/SpacePrimaryIdentity';
import { TwoFactorAuth } from './components/TwoFactorAuth';

export type FormValues = {
  name: string;
  spaceImage?: string | null;
  spaceArtwork?: string | null;
  domain: string;
  notificationToggles: NotificationToggles;
  requireMembersTwoFactorAuth: boolean;
  primaryMemberIdentity?: IdentityType | null;
  customDomain?: string | null;
  snapshotDomain?: string | null;
};

const schema: yup.Schema<FormValues> = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(),
  spaceArtwork: yup.string().nullable(),
  notificationToggles: yup.object(),
  requireMembersTwoFactorAuth: yup.boolean().required(),
  primaryMemberIdentity: yup.string<IdentityType>().nullable(),
  domain: yup
    .string()
    .ensure()
    .trim()
    .min(3, 'Domain must be at least 3 characters')
    .matches(/^[^!?@#$%^&*+=<>(){}.'"\\[\]|~/]*$/, 'The symbols you entered are not allowed')
    .matches(/^\S*$/, 'Space is not allowed'),
  customDomain: yup
    .string()
    .nullable()
    .test('isCusotmDomainValid', 'Please provide valid domain name.', (value) => !value || isValidDomainName(value)),
  snapshotDomain: yup
    .string()
    .nullable()
    .min(3, 'Snapshot domain must be at least 3 characters')
    .test('checkDomain', 'Snapshot domain not found', async (domain) => {
      if (domain) {
        const foundSpace = await getSnapshotSpace(domain);
        return isTruthy(foundSpace);
      }
      return true;
    })
});

export function SpaceSettings({
  space,
  setUnsavedChanges
}: {
  space: Space;
  setUnsavedChanges: (value: boolean) => void;
}) {
  const router = useRouter();
  const { spaces, setSpace, setSpaces } = useSpaces();
  const isAdmin = useIsAdmin();
  const { memberProfileTypes: currentMemberProfileTypes } = useMemberProfileTypes();
  const { features: currentFeatures } = useSpaceFeatures();
  const workspaceRemoveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-remove' });
  const workspaceLeaveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-leave' });
  const unsavedChangesModalState = usePopupState({ variant: 'popover', popupId: 'unsaved-changes' });
  const memberProfilesPopupState = usePopupState({ variant: 'popover', popupId: 'member-profiles' });
  const [featuresInput, setFeatures] = useState(currentFeatures);
  const [memberProfileTypesInput, setMemberProfileProperties] = useState(currentMemberProfileTypes);

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

  const {
    register: registerNewTitle,
    watch: watchNewTitle,
    reset: resetNewTitle,
    setValue: setValueNewTitle
  } = useForm<{ newTitle: string }>({
    defaultValues: { newTitle: '' },
    resolver: yupResolver(yup.object({ newTitle: yup.string().trim() }))
  });
  const newTitle = watchNewTitle('newTitle');

  const { trigger: updateSpace, error: updateSpaceError, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);

  useTrackPageView({ type: 'settings/space' });

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');
  const watchSpaceArtwork = watch('spaceArtwork');

  async function onSubmit(values: FormValues) {
    if (!isAdmin || !values.domain) return;

    // remove 'true' values from notificationToggles
    const notificationToggles = { ...values.notificationToggles };
    for (const key in notificationToggles) {
      if (notificationToggles[key as NotificationToggleOption] !== false) {
        delete notificationToggles[key as NotificationToggleOption];
      }
    }

    // reload with new subdomain
    const newDomain = space.domain !== values.domain;

    await updateSpace(
      {
        notificationToggles,
        features: featuresInput,
        memberProfiles: memberProfileTypesInput,
        name: values.name,
        domain: values.domain,
        primaryMemberIdentity: values.primaryMemberIdentity || null,
        spaceImage: values.spaceImage,
        spaceArtwork: values.spaceArtwork,
        requireMembersTwoFactorAuth: values.requireMembersTwoFactorAuth,
        customDomain: values.customDomain || null,
        snapshotDomain: values.snapshotDomain
      },
      {
        onSuccess: (updatedSpace) => {
          setSpace(updatedSpace);
          reset(_getFormValues(updatedSpace));
        }
      }
    );

    if (newDomain) {
      // add a delay so that the form resets and doesnt block user from reloading due to calling usePreventReload(isDirty)
      setTimeout(() => {
        const subdomain = getSpaceDomainFromHost();
        if (subdomain) {
          window.location.href = `${getSpaceUrl({ domain: values.domain })}${getSubdomainPath(router.asPath)}`;
        } else {
          window.location.href = router.asPath.replace(space.domain, values.domain as string);
        }
      }, 100);
    }
  }

  function handleMemberProfileProperties(id: MemberProfileJson['id'], title: string) {
    setMemberProfileProperties((prevState) => {
      const prevMemberProfiles = [...prevState];
      const targetedMemberProfileIndex = prevMemberProfiles.findIndex((_mp) => _mp.id === id);
      prevMemberProfiles[targetedMemberProfileIndex] = {
        id,
        title,
        isHidden: false
      };
      if (prevMemberProfiles.every((_mp) => _mp.isHidden === false)) {
        memberProfilesPopupState.close();
      }
      return prevMemberProfiles;
    });
  }

  function closeInviteLinkDeleteModal() {
    workspaceRemoveModalState.close();
  }

  async function deleteWorkspace() {
    workspaceRemoveModalState.open();
  }

  async function changeOptionsOrder(draggedProperty: Feature, droppedOnProperty: Feature) {
    const newOrder = [...featuresInput];
    const propIndex = newOrder.findIndex((_feat) => _feat.id === draggedProperty); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((_feat) => _feat.id === droppedOnProperty); // find the index of the space that was dropped on
    newOrder.splice(droppedOnIndex, 0, deletedElements[0]); // add the property to the new index
    setFeatures(newOrder);
  }

  async function changeMembersOrder(draggedProperty: MemberProfileName, droppedOnProperty: MemberProfileName) {
    const newOrder = [...memberProfileTypesInput];
    const propIndex = newOrder.findIndex((_feat) => _feat.id === draggedProperty); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((_feat) => _feat.id === droppedOnProperty); // find the index of the space that was dropped on
    newOrder.splice(droppedOnIndex, 0, deletedElements[0]); // add the property to the new index
    setMemberProfileProperties(newOrder);
  }

  const dataChanged =
    !isEqual(currentFeatures, featuresInput) || !isEqual(currentMemberProfileTypes, memberProfileTypesInput) || isDirty;

  useEffect(() => {
    setUnsavedChanges(dataChanged);

    return () => {
      setUnsavedChanges(false);
    };
  }, [dataChanged]);

  usePreventReload(dataChanged);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3} p='20px 24px'>
          <Grid item>
            <Legend>Overview</Legend>
          </Grid>
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
                  {updateSpaceError && (
                    <FormHelperText error>{updateSpaceError?.message || 'Something went wrong'}</FormHelperText>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid item>
            <TwoFactorAuth control={control} isAdmin={isAdmin} />
          </Grid>
          <Grid item>
            <FieldLabel>Notifications</FieldLabel>
            <Typography variant='caption' mb={1} component='p'>
              Control notifications for your members.
            </Typography>
            <NotificationTogglesInput
              control={control}
              isAdmin={isAdmin}
              register={register}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
          <Grid item>
            <SpacePrimaryIdentity register={register} disabled={!isAdmin} />
          </Grid>
          <Grid item>
            <FieldLabel>Custom Artwork</FieldLabel>
            <Typography variant='caption' mb={2} component='p'>
              Show your artwork for onboarding users.
            </Typography>
            <Avatar
              name={watchName}
              variant='rounded'
              image={watchSpaceArtwork}
              updateImage={(url: string) => setValue('spaceArtwork', url, { shouldDirty: true })}
              editable={isAdmin}
            />
            <TextField {...register('spaceArtwork')} sx={{ visibility: 'hidden', width: '0px', height: '0px' }} />
          </Grid>
          <Grid item>
            <FieldLabel>Sidebar Options</FieldLabel>
            <Typography mb={1} variant='caption' component='p'>
              Turn on and off the visibility of the following modules in the sidebar. The functionality will still
              exist, but it won't be visible in the sidebar.
            </Typography>
            <Stack>
              {featuresInput.map(({ id, isHidden, title, path }) => {
                return (
                  <DraggableListItem
                    key={id}
                    name='sidebarOptionItem'
                    itemId={id}
                    disabled={!isAdmin}
                    changeOrderHandler={async (draggedProperty: string, droppedOnProperty: string) =>
                      changeOptionsOrder(draggedProperty as Feature, droppedOnProperty as Feature)
                    }
                  >
                    <PopupState variant='popover' popupId='features-rename'>
                      {(popupState) => (
                        <>
                          <SettingsItem
                            sx={{ gap: 0 }}
                            data-test={`settings-feature-item-${id}`}
                            actions={[
                              <MenuItem
                                key='1'
                                data-test={`settings-feature-option-${isHidden ? 'show' : 'hide'}`}
                                onClick={() => {
                                  setFeatures((prevState) => {
                                    const newState = [...prevState];
                                    const index = newState.findIndex((_feat) => _feat.id === id);
                                    newState[index] = { ...newState[index], isHidden: !newState[index].isHidden };
                                    return [...newState];
                                  });
                                }}
                              >
                                {isHidden ? 'Show' : 'Hide'}
                              </MenuItem>,
                              <MenuItem
                                key='2'
                                data-test='settings-feature-option-rename'
                                onClick={(e) => {
                                  setValueNewTitle('newTitle', title);
                                  popupState.open(e);
                                }}
                              >
                                Rename
                              </MenuItem>
                            ]}
                            disabled={!isAdmin}
                            hidden={isHidden}
                            text={
                              <Box display='flex' gap={1}>
                                <PageIcon icon={null} pageType={path} />
                                {title}
                              </Box>
                            }
                          />
                          <ModalWithButtons
                            {...bindPopover(popupState)}
                            title={`Rename ${title}`}
                            buttonText='Continue'
                            disabled={newTitle === '' || newTitle === title}
                            onConfirm={() => {
                              setFeatures((prevState) => {
                                const newState = [...prevState];
                                const index = newState.findIndex((_feat) => _feat.id === id);
                                newState[index] = { ...newState[index], title: newTitle };
                                return [...newState];
                              });
                              resetNewTitle();
                            }}
                          >
                            <TextField {...registerNewTitle('newTitle')} fullWidth />
                          </ModalWithButtons>
                        </>
                      )}
                    </PopupState>
                  </DraggableListItem>
                );
              })}
            </Stack>
          </Grid>
          <Grid item>
            <FieldLabel>Member Profiles</FieldLabel>
            <Typography mb={1} variant='caption' component='p'>
              Set the order and turn on and off the visibility of certain onchain profiles for your members.
            </Typography>
            <Stack gap={1}>
              {memberProfileTypesInput
                .filter((mp) => !mp.isHidden)
                .map(({ id, title }) => {
                  const profileWidgetLogo = getProfileWidgetLogo(id);
                  return (
                    <DraggableListItem
                      key={id}
                      name='memberProfileItem'
                      itemId={id}
                      disabled={!isAdmin}
                      changeOrderHandler={async (draggedProperty: string, droppedOnProperty: string) =>
                        changeMembersOrder(draggedProperty as MemberProfileName, droppedOnProperty as MemberProfileName)
                      }
                    >
                      <SettingsItem
                        sx={{ gap: 0 }}
                        data-test={`settings-profiles-item-${id}`}
                        actions={[
                          <MenuItem
                            key='1'
                            data-test='settings-profiles-option-hide'
                            onClick={() => {
                              setMemberProfileProperties((prevState) => {
                                const newState = [...prevState];
                                const index = newState.findIndex((prevMp) => prevMp.id === id);
                                newState[index] = { id, title, isHidden: true };
                                return [...newState];
                              });
                            }}
                          >
                            Hide
                          </MenuItem>
                        ]}
                        disabled={!isAdmin}
                        text={
                          <Box display='flex' alignItems='center' gap={1}>
                            {typeof profileWidgetLogo === 'string' ? (
                              <Image width={25} height={25} alt={id} src={profileWidgetLogo} />
                            ) : (
                              profileWidgetLogo
                            )}
                            <Typography>{title}</Typography>
                          </Box>
                        }
                      />
                    </DraggableListItem>
                  );
                })}
            </Stack>
            {isAdmin && memberProfileTypesInput.filter((mp) => mp.isHidden).length > 0 && (
              <Button
                sx={{ flexGrow: 0 }}
                {...bindTrigger(memberProfilesPopupState)}
                variant='text'
                data-test='settings-add-profiles-button'
              >
                + Add more profiles
              </Button>
            )}
          </Grid>
          <Grid item>
            <SetupCustomDomain space={space} errorMessage={errors.customDomain?.message} register={register} />
          </Grid>
          <Grid item>
            <Legend>Snapshot.org Integration</Legend>
            <FieldLabel>Snapshot domain</FieldLabel>
            {!space?.snapshotDomain && !isAdmin ? (
              <Typography>No Snapshot domain connected yet. Only space admins can configure this.</Typography>
            ) : (
              <TextField
                {...register('snapshotDomain')}
                disabled={!isAdmin}
                fullWidth
                error={!!errors.snapshotDomain}
                helperText={errors.snapshotDomain?.message}
              />
            )}
          </Grid>
          <Grid item>
            <Legend>Collab.land Integration</Legend>
            <ConnectCollabland />
          </Grid>
          <Grid item>
            <Legend helperText={`Advanced settings for ${isAdmin ? 'deleting' : 'leaving'} a space.`}>Warning</Legend>
            {isAdmin ? (
              <Button variant='outlined' color='error' onClick={deleteWorkspace} data-test='submit-space-delete'>
                Delete Space
              </Button>
            ) : (
              <Button variant='outlined' color='error' onClick={workspaceLeaveModalState.open}>
                Leave Space
              </Button>
            )}
          </Grid>
        </Grid>
        {isAdmin && dataChanged && (
          <Box
            sx={{
              py: 1,
              px: { xs: 5, md: 10 },
              position: 'sticky',
              bottom: '0',
              background: (theme) => theme.palette.background.paper,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              textAlign: 'right'
            }}
          >
            <Button
              disableElevation
              data-test='submit-space-update'
              sx={{ alignSelf: 'flex-start' }}
              disabled={updateSpaceLoading || !dataChanged}
              type='submit'
              loading={updateSpaceLoading}
            >
              Save
            </Button>
          </Box>
        )}
      </form>
      <ConfirmDeleteModal
        title='Delete space'
        onClose={closeInviteLinkDeleteModal}
        open={workspaceRemoveModalState.isOpen}
        buttonText={`Delete ${space.name}`}
        question={`Are you sure you want to delete ${space.name}? This action cannot be undone`}
        onConfirm={async () => {
          if (isAdmin) {
            await charmClient.spaces.deleteSpace(space.id);
            // redirect to default workspace
            window.location.href = window.location.origin;
          }
        }}
      />
      <ConfirmDeleteModal
        title='Leave space'
        onClose={workspaceLeaveModalState.close}
        open={workspaceLeaveModalState.isOpen}
        buttonText={`Leave ${space.name}`}
        question={`Are you sure you want to leave ${space.name}?`}
        onConfirm={async () => {
          await charmClient.spaces.leaveSpace(space.id);
          const filteredSpaces = spaces.filter((s) => s.id !== space.id);
          setSpaces(filteredSpaces);
        }}
      />
      <ConfirmDeleteModal
        open={unsavedChangesModalState.isOpen}
        title='You have unsaved changes'
        onClose={unsavedChangesModalState.close}
        buttonText='Save changes'
        question='Are you sure you want to discard unsaved changes'
        onConfirm={unsavedChangesModalState.close}
      />
      <AddMoreMemberProfilesModal
        title='Add more member profiles'
        {...bindPopover(memberProfilesPopupState)}
        memberProfileTypesInput={memberProfileTypesInput}
        handleMemberProfileProperties={handleMemberProfileProperties}
      />
    </>
  );
}

function _getFormValues(space: Space): FormValues {
  return {
    name: space.name,
    spaceImage: space.spaceImage,
    spaceArtwork: space.spaceArtwork,
    domain: space.domain,
    requireMembersTwoFactorAuth: space.requireMembersTwoFactorAuth,
    notificationToggles: getDefaultValues(space.notificationToggles as NotificationToggles),
    customDomain: space.customDomain,
    snapshotDomain: space.snapshotDomain,
    primaryMemberIdentity: space.primaryMemberIdentity
  };
}
