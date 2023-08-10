import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
  TextField,
  FormHelperText,
  MenuItem,
  ListItem,
  List,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import isEqual from 'lodash/isEqual';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ConnectSnapshot from 'components/common/PageActions/components/SnapshotAction/ConnectSnapshot';
import DraggableListItem from 'components/common/PageLayout/components/DraggableListItem';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import {
  type Feature,
  type FeatureJson,
  STATIC_PAGES_RECORD
} from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { getDefaultWorkspaceUrl } from 'components/login/LoginPage';
import Legend from 'components/settings/Legend';
import { SetupCustomDomain } from 'components/settings/space/components/SetupCustomDomain';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import type { MemberProfileJson, MemberProfileName } from 'lib/profile/memberProfiles';
import { getSpaceUrl, getSubdomainPath } from 'lib/utilities/browser';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';
import { capitalize } from 'lib/utilities/strings';

import Avatar from './components/LargeAvatar';
import SettingsItem from './components/SettingsItem';

const schema = yup.object({
  name: yup.string().ensure().trim().min(3, 'Name must be at least 3 characters').required('Name is required'),
  spaceImage: yup.string().nullable(true),
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
  const isAdmin = useIsAdmin();
  const workspaceRemoveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-remove' });
  const workspaceLeaveModalState = usePopupState({ variant: 'popover', popupId: 'workspace-leave' });
  const unsavedChangesModalState = usePopupState({ variant: 'popover', popupId: 'unsaved-changes' });
  const memberProfilesPopupState = usePopupState({ variant: 'popover', popupId: 'member-profiles' });
  const [features, setFeatures] = useState(space.features as FeatureJson[]);
  const [memberProfiles, setMemberProfiles] = useState(space.memberProfiles as MemberProfileJson[]);
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
    trigger: updateSpace,
    error,
    isMutating
  } = useSWRMutation(
    `/spaces/${space.id}`,
    (_url, { arg }: Readonly<{ arg: Partial<Space> }>) => charmClient.spaces.updateSpace(arg),
    {
      onSuccess: (updatedSpace) => {
        setSpace(updatedSpace);
        reset(_getFormValues(updatedSpace));
      }
    }
  );

  // set default values when space is set
  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space.id, type: 'settings' });
  }, [space.id]);

  const watchName = watch('name');
  const watchSpaceImage = watch('spaceImage');

  async function onSubmit(values: FormValues) {
    if (!isAdmin || !values.domain) return;

    const updatedFeatures = isEqual(features, space.features) ? undefined : features;
    const updatedProfiles = isEqual(memberProfiles, space.memberProfiles) ? undefined : memberProfiles;

    let notifyNewProposals: Date | null | undefined;
    if (!values.notifyNewProposals) {
      notifyNewProposals = null;
    } else if (!space.notifyNewProposals) {
      notifyNewProposals = new Date();
    }

    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    await updateSpace({
      id: space.id,
      notifyNewProposals,
      features: updatedFeatures,
      memberProfiles: updatedProfiles,
      name: values.name,
      domain: values.domain,
      spaceImage: values.spaceImage
    });

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
    }
  }

  function closeInviteLinkDeleteModal() {
    workspaceRemoveModalState.close();
  }

  async function deleteWorkspace() {
    workspaceRemoveModalState.open();
  }

  async function changeOptionsOrder(draggedProperty: Feature, droppedOnProperty: Feature) {
    const newOrder = [...features];
    const propIndex = newOrder.findIndex((_feat) => draggedProperty === _feat.id); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((_feat) => _feat.id === droppedOnProperty); // find the index of the space that was dropped on
    newOrder.splice(droppedOnIndex, 0, deletedElements[0]); // add the property to the new index
    setFeatures(newOrder);
  }

  async function changeMembersOrder(draggedProperty: MemberProfileName, droppedOnProperty: MemberProfileName) {
    const newOrder = [...memberProfiles];
    const propIndex = newOrder.findIndex((_feat) => draggedProperty === _feat.id); // find the property that was dragged
    const deletedElements = newOrder.splice(propIndex, 1); // remove the dragged property from the array
    const droppedOnIndex = newOrder.findIndex((_feat) => _feat.id === droppedOnProperty); // find the index of the space that was dropped on
    newOrder.splice(droppedOnIndex, 0, deletedElements[0]); // add the property to the new index
    setMemberProfiles(newOrder);
  }

  usePreventReload(isDirty);

  const enableButton = !isEqual(space.features, features) || !isEqual(space.memberProfiles, memberProfiles) || isDirty;

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
                  {error && <FormHelperText error>{error?.message || error || 'Something went wrong'}</FormHelperText>}
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid item>
            <FieldLabel>Notifications</FieldLabel>
            <Typography variant='caption' mb={1} component='p'>
              Control space-wide notifications for your members.
            </Typography>
            <Stack>
              <Controller
                control={control}
                name='notifyNewProposals'
                render={({ field: { onChange, value } }) => {
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
            <FieldLabel>Sidebar Options</FieldLabel>
            <Typography mb={1} variant='caption' component='p'>
              Turn on and off the visibility of the following modules in the sidebar. The functionality will still
              exist, but it won't be visible in the sidebar.
            </Typography>
            <Stack>
              {features.map(({ id, isHidden }) => {
                const page = STATIC_PAGES_RECORD[id];
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
                    <SettingsItem
                      sx={{ gap: 0 }}
                      actions={[
                        <MenuItem
                          key={`action_${id}`}
                          onClick={() => {
                            setFeatures((prevState) => {
                              const newState = [...prevState];
                              const index = newState.findIndex((_feat) => _feat.id === id);
                              newState[index] = { id, isHidden: !newState[index].isHidden };
                              return [...newState];
                            });
                          }}
                        >
                          {isHidden ? 'Show' : 'Hide'}
                        </MenuItem>
                      ]}
                      disabled={!isAdmin}
                      hidden={isHidden}
                      text={
                        <Box display='flex' gap={1}>
                          {!!page && <PageIcon icon={null} pageType={page.path} />}
                          {featureLabels[id]}
                        </Box>
                      }
                    />
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
              {memberProfiles
                .filter((mp) => !mp.isHidden)
                .map((mp) => (
                  <DraggableListItem
                    key={mp.id}
                    name='memberProfileItem'
                    itemId={mp.id}
                    disabled={!isAdmin}
                    changeOrderHandler={async (draggedProperty: string, droppedOnProperty: string) =>
                      changeMembersOrder(draggedProperty as MemberProfileName, droppedOnProperty as MemberProfileName)
                    }
                  >
                    <SettingsItem
                      sx={{ gap: 0 }}
                      actions={[
                        <MenuItem
                          key={mp.id}
                          onClick={() => {
                            setMemberProfiles((prevState) => {
                              const newState = [...prevState];
                              const index = newState.findIndex((prevMp) => mp.id === prevMp.id);
                              newState[index] = { id: mp.id, isHidden: true };
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
                          <Image width={25} height={25} alt={mp.id} src={getProfileWidgetLogo(mp.id)} />
                          <Typography>{capitalize(mp.id)}</Typography>
                        </Box>
                      }
                    />
                  </DraggableListItem>
                ))}
            </Stack>
            {isAdmin && memberProfiles.filter((mp) => mp.isHidden).length > 0 && (
              <Button sx={{ flexGrow: 0 }} {...bindTrigger(memberProfilesPopupState)} variant='text'>
                + Add more profiles
              </Button>
            )}
          </Grid>
          {isAdmin && (
            <Grid item display='flex' justifyContent='space-between'>
              <Button
                disableElevation
                size='large'
                data-test='submit-space-update'
                disabled={isMutating || !enableButton}
                type='submit'
              >
                Save
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
      <SetupCustomDomain space={space} />
      <Legend mt={3}>Snapshot.org Integration</Legend>
      <ConnectSnapshot />
      <Legend mt={3} helperText={`Advanced settings for ${isAdmin ? 'deleting' : 'leaving'} a space.`}>
        Warning
      </Legend>
      {isAdmin ? (
        <Button variant='outlined' color='error' onClick={deleteWorkspace} data-test='submit-space-delete'>
          Delete Space
        </Button>
      ) : (
        <Button variant='outlined' color='error' onClick={workspaceLeaveModalState.open}>
          Leave Space
        </Button>
      )}
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
      <Modal
        size='large'
        open={memberProfilesPopupState.isOpen}
        onClose={memberProfilesPopupState.close}
        title='Add more member profiles'
      >
        <List>
          {memberProfiles
            .filter((mp) => mp.isHidden)
            .map((mp) => (
              <ListItem
                key={mp.id}
                secondaryAction={
                  <Button
                    onClick={() => {
                      setMemberProfiles((prevState) => {
                        const prevMemberProfiles = [...prevState];
                        const targetedMemberProfileIndex = prevMemberProfiles.findIndex((_mp) => _mp.id === mp.id);
                        prevMemberProfiles[targetedMemberProfileIndex] = { id: mp.id, isHidden: false };
                        if (prevMemberProfiles.every((_mp) => _mp.isHidden === false)) {
                          memberProfilesPopupState.close();
                        }
                        return prevMemberProfiles;
                      });
                    }}
                  >
                    Add
                  </Button>
                }
              >
                <ListItemIcon>x</ListItemIcon>
                <ListItemText primary={capitalize(mp.id)} />
              </ListItem>
            ))}
        </List>
      </Modal>
    </>
  );
}

function _getFormValues(space: Space): FormValues {
  return {
    name: space.name,
    spaceImage: space.spaceImage,
    domain: space.domain,
    notifyNewProposals: !!space.notifyNewProposals
  };
}

function getProfileWidgetLogo(name: MemberProfileName) {
  switch (name) {
    case 'charmverse':
      return '/images/logos/charmverse_black.png';
    case 'collection':
      return '/images/template_icons/nft_community_icon.svg';
    case 'ens':
      return '/images/logos/ens_logo.svg';
    case 'lens':
      return '/images/logos/lens_logo.svg';
    case 'summon':
      return '/images/logos/game7_logo.svg';
    default:
      return '';
  }
}
