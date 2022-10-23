import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Modal from 'components/common/Modal';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useUser } from 'hooks/useUser';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

function MemberPropertiesOnBoardingForm ({ memberId, spaceId, onClose }: { onClose: () => void, spaceId: string, memberId: string }) {
  const { updateSpaceValues } = useMemberPropertyValues(memberId);

  return (
    <MemberPropertiesPopupForm
      onClose={onClose}
      memberId={memberId}
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
    setUrlWithoutRerender(window.location.href, {});
    memberDirectoryFormModal.close();
  }

  return (
    <Modal size='large' open={memberDirectoryFormModal.isOpen} onClose={onClose}>
      {space && user && (
        <MemberPropertiesOnBoardingForm
          memberId={user.id}
          spaceId={space.id}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
