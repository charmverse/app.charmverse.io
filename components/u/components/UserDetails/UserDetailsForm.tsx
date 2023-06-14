import type { IdentityType, UserDetails as UserDetailsType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { useIdentityTypes } from 'components/settings/account/components/useIdentityTypes';
import Avatar from 'components/settings/space/components/LargeAvatar';
import { useMembers } from 'hooks/useMembers';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import type { Social } from '../../interfaces';
import { IdentityIcon } from '../IdentityIcon';
import IdentityModal from '../IdentityModal';
import { SocialInputs } from '../SocialInputs';
import { TimezoneAutocomplete } from '../TimezoneAutocomplete';
import UserDescription from '../UserDescription';
import UserPathModal from '../UserPathModal';

import { useUpdateProfileAvatar } from './hooks/useUpdateProfileAvatar';
import { useUserDetails } from './hooks/useUserDetails';

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

  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const userPathModalState = usePopupState({ variant: 'popover', popupId: 'path-modal' });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();
  const { saveUser } = useUserDetails();

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

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

  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path;
  const userLink = `${hostname}/u/${userPath}`;

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
        <Grid item width='100%'>
          <EditIconContainer onClick={userPathModalState.open}>
            <Typography noWrap>
              {hostname}/u/
              <Link external href={userLink} target='_blank'>
                {userPath}
              </Link>
            </Typography>
            <Tooltip placement='top' title={isPersonalLinkCopied ? 'Copied' : 'Click to copy link'} arrow>
              <Box sx={{ display: 'grid' }}>
                <CopyToClipboard text={userLink} onCopy={onLinkCopy}>
                  <IconButton>
                    <ContentCopyIcon fontSize='small' />
                  </IconButton>
                </CopyToClipboard>
              </Box>
            </Tooltip>
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
      <UserPathModal
        isOpen={userPathModalState.isOpen}
        close={userPathModalState.close}
        save={(path: string) => {
          saveUser({ path });
          userPathModalState.close();
        }}
        currentValue={user.path}
      />
    </>
  );
}
export function UserDetailsFormWithSave({ user }: Pick<UserDetailsProps, 'user'>) {
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
