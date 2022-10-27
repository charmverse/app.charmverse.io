import { usePopupState } from 'material-ui-popup-state/hooks';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

import { MemberOnboardingForm } from './components/MemberOnboardingForm';

export function MemberPropertiesOnBoardingModal () {
  const memberDirectoryFormModal = usePopupState({ variant: 'popover', popupId: 'member-directory-onboarding' });
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { hideOnboarding } = useOnboarding();
  const { onboarding } = useOnboarding();

  function onClose () {
    if (space) {
      hideOnboarding(space.id);
      memberDirectoryFormModal.close();
    }
  }

  if (!space || !user) {
    return null;
  }

  if (!onboarding[space.id]) {
    return null;
  }

  return (
    <MemberOnboardingForm
      userId={user.id}
      spaceName={space.name}
      spaceId={space.id}
      onClose={onClose}
    />
  );
}
