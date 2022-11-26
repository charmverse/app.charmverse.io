import { Divider, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import { UserDetails } from 'components/profile/components';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import type { LoggedInUser } from 'models';

type Props = {
  user: LoggedInUser;
  setUser: Dispatch<SetStateAction<LoggedInUser | null>>;
  onClose: () => void;
  spaceName: string;
  spaceId: string;
}

export function MemberOnboardingForm ({ setUser, user, spaceId, spaceName, onClose }: Props) {

  const { updateSpaceValues } = useMemberPropertyValues(user.id);

  return (
    <MemberPropertiesPopupForm
      title={`Welcome to ${spaceName}. Set up your profile`}
      onClose={onClose}
      memberId={user.id}
      spaceId={spaceId}
      updateMemberPropertyValues={updateSpaceValues}
      cancelButtonText='Set up later'
    >
      {user && (
        <>
          <UserDetails
            sx={{
              mt: 0
            }}
            user={user}
            updateUser={setUser}
          />
          <Divider sx={{ my: 1 }} />
        </>
      )}
      <Typography fontWeight={600}>{spaceName} Member details</Typography>
    </MemberPropertiesPopupForm>
  );
}
