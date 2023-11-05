import type { IdentityType, UserDetails as UserDetailsType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import { Box, Grid, Stack, Typography } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { useIdentityTypes } from 'components/settings/account/hooks/useIdentityTypes';
import Avatar from 'components/settings/space/components/LargeAvatar';
import { useMembers } from 'hooks/useMembers';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Social } from 'lib/members/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { shortWalletAddress } from 'lib/utilities/blockchain';
import type { LoggedInUser } from 'models';

import { useUpdateProfileAvatar } from '../hooks/useUpdateProfileAvatar';
import { useUserDetails } from '../hooks/useUserDetails';

import { IdentityIcon } from './IdentityIcon';
import IdentityModal from './IdentityModal';
import { SocialInputs } from './SocialInputs';
import { TimezoneAutocomplete } from './TimezoneAutocomplete';
import UserDescription from './UserDescription';

export type EditableFields = Partial<Omit<UserDetailsType, 'id'>>;

export interface UserDetailsProps {
  user: LoggedInUser;
  sx?: SxProps<Theme>;
  onChange: (user: EditableFields) => void;
}

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()}
`;

function EditIconContainer({
  children,
  onClick,
  ...props
}: { children: ReactNode; onClick: IconButtonProps['onClick'] } & IconButtonProps) {
  return (
    <StyledStack direction='row' spacing={1} alignItems='center'>
      {children}
      <IconButton onClick={onClick} {...props} className='icons'>
        <EditIcon fontSize='small' />
      </IconButton>
    </StyledStack>
  );
}

export function UserDetailsForm({ user, onChange, sx = {} }: UserDetailsProps) {
  const { data: userDetails, isLoading } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const identityTypes = useIdentityTypes();

  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();
  const { saveUser } = useUserDetails();

  const setDescription = async (description: string) => {
    onChange({ description });
  };

  const setTimezone = async (timezone: string | null = null) => {
    onChange({ timezone });
  };

  const setSocial = async (social: Social) => {
    onChange({ social });
  };

  const disabled = isLoading;

  return (
    <>
      <Grid container direction='column' spacing={2} mt={1} sx={sx}>
        <Grid item>
          <Avatar
            name={user.username || ''}
            image={user.avatar}
            updateAvatar={updateProfileAvatar}
            variant='circular'
            canSetNft
            editable={true}
            isSaving={isSavingAvatar}
            isNft={hasNftAvatar(user)}
          />
        </Grid>
        <Grid item width='100%'>
          <EditIconContainer data-testid='edit-identity' onClick={identityModalState.open}>
            <IdentityIcon type={user.identityType as IdentityType} />
            <Typography variant='h1' noWrap>
              {shortWalletAddress(user.username)}
            </Typography>
          </EditIconContainer>
        </Grid>
        <Grid item>
          <UserDescription currentDescription={userDetails?.description} save={setDescription} readOnly={disabled} />
        </Grid>
        <Grid item>
          <TimezoneAutocomplete userTimezone={userDetails?.timezone} save={setTimezone} readOnly={disabled} />
        </Grid>
        <SocialInputs social={userDetails?.social as Social} save={setSocial} readOnly={disabled} />
      </Grid>
      <IdentityModal
        isOpen={identityModalState.isOpen}
        close={identityModalState.close}
        save={(username: string, identityType: IdentityType) => {
          saveUser({ username, identityType });
        }}
        identityTypes={identityTypes}
        identityType={(user?.identityType || 'Wallet') as IdentityType}
      />
    </>
  );
}

export function UserDetailsFormWithSave({
  user,
  setUnsavedChanges
}: Pick<UserDetailsProps, 'user'> & { setUnsavedChanges: (dataChanged: boolean) => void }) {
  const [form, setForm] = useState<EditableFields>({});
  const { mutateMembers } = useMembers();
  const { showMessage } = useSnackbar();
  const { trigger: updateUserDetails } = useSWRMutation(
    '/api/profile/details',
    (_url, { arg }: Readonly<{ arg: Partial<UserDetailsType> }>) => charmClient.updateUserDetails(arg)
  );
  const isFormClean = Object.keys(form).length === 0;

  usePreventReload(!isFormClean);

  function onFormChange(fields: EditableFields) {
    setForm((_form) => ({ ..._form, ...fields }));
  }

  async function saveForm() {
    await updateUserDetails(form);
    await mutateMembers();
    setForm({});
    showMessage('Profile updated', 'success');
    mutate('/current-user-details');
  }

  useEffect(() => {
    setUnsavedChanges(!isFormClean);

    return () => {
      setUnsavedChanges(false);
    };
  }, [isFormClean]);

  return (
    <>
      <UserDetailsForm user={user} onChange={onFormChange} />
      <Box mt={2} display='flex' justifyContent='flex-end'>
        <Button disableElevation size='large' disabled={isFormClean} onClick={saveForm}>
          Save
        </Button>
      </Box>
    </>
  );
}
