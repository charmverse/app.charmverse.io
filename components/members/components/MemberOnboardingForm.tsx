import { Divider, Typography } from '@mui/material';

import { UserDetails } from 'components/profile/components';
import { MemberPropertiesPopup } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useUser } from 'hooks/useUser';

export function MemberOnboardingForm({
  userId,
  spaceId,
  spaceName,
  onClose,
  title
}: {
  onClose: () => void;
  spaceName: string;
  spaceId: string;
  userId: string;
  title?: string;
}) {
  const { updateSpaceValues } = useMemberPropertyValues(userId);
  const { setUser, user } = useUser();

  return (
    <MemberPropertiesPopup
      title={title ?? `Welcome to ${spaceName}. Set up your profile`}
      onClose={onClose}
      memberId={userId}
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
