import type { IdentityType, UserDetails as UserDetailsType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import type { LoggedInUser } from '@packages/profile/getUser';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';

import { Button } from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import {
  useRequiredMemberProperties,
  useRequiredUserDetailsForm
} from 'components/members/hooks/useRequiredMemberProperties';
import Avatar from 'components/settings/space/components/LargeAvatar';
import { usePreventReload } from 'hooks/usePreventReload';
import type { Social } from 'lib/members/interfaces';

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
  userDetails?: EditableFields;
  errors?: FieldErrors<{
    description: string | null;
    social: FieldErrors<Record<keyof Social, string | null>>;
    timezone: string | null;
    locale: string | null;
  }>;
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

export function UserDetailsForm({ errors, userDetails, user, onChange, sx = {} }: UserDetailsProps) {
  const { isBioRequired, isTimezoneRequired, isLinkedinRequired, isGithubRequired, isTwitterRequired } =
    useRequiredMemberProperties({ userId: user.id });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();

  const setDescription = (description: string) => {
    onChange({ description });
  };

  const setTimezone = (timezone: string | null = null) => {
    onChange({ timezone });
  };

  const setSocial = (social: Social) => {
    onChange({ social });
  };

  return (
    <>
      <Stack spacing={2} mt={1} sx={sx} width='100%'>
        <Box width='fit-content'>
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
        </Box>
        <EditIconContainer data-testid='edit-identity' onClick={identityModalState.open}>
          <IdentityIcon type={user.identityType as IdentityType} />
          <Typography variant='h1' noWrap>
            {shortWalletAddress(user.username)}
          </Typography>
        </EditIconContainer>
        <UserDescription
          description={userDetails?.description || ''}
          onChange={setDescription}
          error={errors?.description}
          required={isBioRequired}
        />
        <TimezoneAutocomplete
          required={isTimezoneRequired}
          userTimezone={userDetails?.timezone}
          onChange={setTimezone}
        />
        <SocialInputs
          errors={errors?.social as FieldErrors<Record<keyof Social, string | null>>}
          required={{
            discordUsername: false,
            githubURL: isGithubRequired,
            linkedinURL: isLinkedinRequired,
            twitterURL: isTwitterRequired
          }}
          social={userDetails?.social as Social}
          onChange={setSocial}
        />
      </Stack>
      <IdentityModal isOpen={identityModalState.isOpen} close={identityModalState.close} />
    </>
  );
}

export function UserDetailsFormWithSave({
  user,
  setUnsavedChanges
}: Pick<UserDetailsProps, 'user'> & { setUnsavedChanges: (dataChanged: boolean) => void }) {
  const { isDirty, isValid, onFormChange, values, errors, isSubmitting, onSubmit } = useRequiredUserDetailsForm({
    userId: user.id
  });
  usePreventReload(isDirty);

  async function saveForm() {
    onSubmit();
    setUnsavedChanges(false);
  }

  useEffect(() => {
    setUnsavedChanges(isDirty);

    return () => {
      setUnsavedChanges(false);
    };
  }, [isDirty, setUnsavedChanges]);

  return (
    <>
      <UserDetailsForm userDetails={values} user={user} errors={errors} onChange={onFormChange} />
      <Box mt={2} display='flex' justifyContent='flex-end'>
        <Button
          disableElevation
          size='large'
          disabled={!isDirty || !isValid}
          disabledTooltip={!isDirty ? 'No changes to save' : 'Please fill out all required fields'}
          onClick={saveForm}
          loading={isSubmitting}
        >
          Save
        </Button>
      </Box>
    </>
  );
}
