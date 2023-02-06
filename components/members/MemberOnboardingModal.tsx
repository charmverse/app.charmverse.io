import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

import { MemberOnboardingForm } from './components/MemberOnboardingForm';

export function MemberOnboardingModal({ userId }: { userId?: string }) {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { onboarded, completeOnboarding } = useOnboarding();

  if (!space || onboarded !== false || !user || !user.spaceRoles.some((sr) => sr.spaceId === space.id)) {
    return null;
  }

  return (
    <div data-test='member-onboarding-form'>
      <MemberOnboardingForm
        userId={userId ?? user.id}
        spaceName={space.name}
        spaceId={space.id}
        onClose={completeOnboarding}
      />
    </div>
  );
}
