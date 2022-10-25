import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Modal from 'components/common/Modal';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useUser } from 'hooks/useUser';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { LoggedInUser } from 'models';

function MemberPropertiesOnBoardingForm ({ user, spaceId, onClose }: { onClose: () => void, spaceId: string, user: LoggedInUser }) {
  const { updateSpaceValues } = useMemberPropertyValues(user.id);
  return (
    <MemberPropertiesPopupForm
      title={`Welcome ${user.username}. Setup your profile`}
      onClose={onClose}
      memberId={user.id}
      spaceId={spaceId}
      updateMemberPropertyValues={updateSpaceValues}
    />
  );
}

export function MemberPropertiesOnBoardingModal () {
  const router = useRouter();
  const memberDirectoryFormModal = usePopupState({ variant: 'popover', popupId: 'member-directory-onboarding' });
  const [space] = useCurrentSpace();
  const { user } = useUser();

  useEffect(() => {
    const onboarding = router.query.onboarding;
    if (onboarding === 'true') {
      memberDirectoryFormModal.open();
    }
  }, [router]);

  function onClose () {
    setUrlWithoutRerender(window.location.href, { onboarding: null });
    memberDirectoryFormModal.close();
  }

  return (
    <Modal size='large' open={memberDirectoryFormModal.isOpen} onClose={onClose}>
      {space && user && (
        <MemberPropertiesOnBoardingForm
          user={user}
          spaceId={space.id}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
