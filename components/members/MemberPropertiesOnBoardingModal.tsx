import { usePopupState } from 'material-ui-popup-state/hooks';

import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

function MemberPropertiesOnBoardingForm (
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

export function MemberPropertiesOnBoardingModal () {
  const memberDirectoryFormModal = usePopupState({ variant: 'popover', popupId: 'member-directory-onboarding' });
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { setOnboarding } = useOnboarding();

  function onClose () {
    setOnboarding(false);
    memberDirectoryFormModal.close();
  }

  return (
    space && user && (
      <MemberPropertiesOnBoardingForm
        userId={user.id}
        spaceName={space.name}
        spaceId={space.id}
        onClose={onClose}
      />
    )
  );
}
