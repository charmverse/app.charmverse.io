import { Divider, Typography } from '@mui/material';

import { MemberPropertiesPopup } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import UserDetails from 'components/profile/components/UserDetails/UserDetails';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useUser } from 'hooks/useUser';

export function MemberOnboardingForm({
  userId,
  spaceId,
  spaceName,
  onClose
}: {
  onClose: () => void;
  spaceName: string;
  spaceId: string;
  userId: string;
}) {
  const { updateSpaceValues } = useMemberPropertyValues(userId);
  const { setUser, user } = useUser();

  return (
    <MemberPropertiesPopup
      title={`Welcome to ${spaceName}. Set up your profile`}
      onClose={onClose}
      memberId={userId}
      spaceId={spaceId}
      updateMemberPropertyValues={updateSpaceValues}
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
          <Divider
            sx={{
              my: 1
            }}
          />
        </>
      )}
      <Typography fontWeight={600}>{spaceName} Member details</Typography>
    </MemberPropertiesPopup>
  );
}
