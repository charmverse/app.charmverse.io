import { MemberMiniProfile } from 'components/profile/components/MemberMiniProfile/MemberMiniProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';

export function MemberOnboardingModal({ userId }: { userId?: string }) {
  const space = useCurrentSpace();
  const { user } = useUser();
  const { onboarded, completeOnboarding } = useOnboarding();

  if (!space || onboarded !== false || !user || !user.spaceRoles.some((sr) => sr.spaceId === space.id)) {
    return null;
  }

  return (
    <div data-test='member-onboarding-form'>
      <MemberMiniProfile
        isOnboarding={!user.email}
        memberId={userId ?? user.id}
        onClose={completeOnboarding}
        title={`Welcome to ${space.name}. Set up your profile`}
      />
    </div>
  );
}
