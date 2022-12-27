import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

import { MemberOnboardingForm } from './components/MemberOnboardingForm';

export function MemberOnboardingModal({ userId }: { userId?: string }) {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { onboarding, completeOnboarding } = useOnboarding();

  if (!space || onboarding !== false || !user) {
    return null;
  }

  return (
    <MemberOnboardingForm
      userId={userId ?? user.id}
      spaceName={space.name}
      spaceId={space.id}
      onClose={completeOnboarding}
    />
  );
}
