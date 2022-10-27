import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';

export function MemberOnboardingForm (
  { userId, spaceId, spaceName, onClose }:
  { onClose: () => void, spaceName: string, spaceId: string, userId: string }
) {
  const { updateSpaceValues } = useMemberPropertyValues(userId);
  return (
    <MemberPropertiesPopupForm
      title={`Welcome to ${spaceName}. Set up your profile`}
      onClose={onClose}
      memberId={userId}
      spaceId={spaceId}
      updateMemberPropertyValues={updateSpaceValues}
      showUserDetailsForm
      cancelButtonText='Set up later'
      spaceName={spaceName}
    />
  );
}
