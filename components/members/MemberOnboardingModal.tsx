import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

import { MemberOnboardingForm } from './components/MemberOnboardingForm';

export function MemberOnboardingModal ({ userId }: { userId?: string }) {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { hideOnboarding } = useOnboarding();
  const { onboarding } = useOnboarding();

  function onClose () {
    if (space) {
      hideOnboarding(space.id);
    }
  }

  if (!space || !onboarding[space.id] || !user) {
    return null;
  }

  return (
    <MemberOnboardingForm
      userId={userId ?? user.id}
      spaceName={space.name}
      spaceId={space.id}
      onClose={onClose}
    />
  );
}
