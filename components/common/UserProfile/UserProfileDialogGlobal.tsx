import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

import { CurrentUserProfile } from './components/CurrentUserProfile';
import { MemberProfile } from './components/MemberProfile';
import { useOnboarding } from './hooks/useOnboarding';
import { useUserProfile } from './hooks/useUserProfile';

export function UserProfileDialogGlobal() {
  const { hideUserProfile, memberId } = useUserProfile();
  const { space } = useCurrentSpace();
  const { getMemberById } = useMembers();
  const member = memberId ? getMemberById(memberId) : null;
  const { user } = useUser();
  const { showOnboardingFlow, completeOnboarding } = useOnboarding({ user, spaceId: space?.id });

  // Wait for user to load before deciding what to show
  if (!user) {
    return null;
  }

  // Show the selected member profile
  if (member) {
    if (member.id === user.id) {
      return <CurrentUserProfile key={user.id} currentUser={user} onClose={hideUserProfile} />;
    }
    return <MemberProfile key={user.id} member={member} space={space} onClose={hideUserProfile} />;
  }

  // Show member profile for onboarding
  if (showOnboardingFlow) {
    return (
      <div data-test='member-onboarding-form'>
        <CurrentUserProfile key={user.id} isOnboarding currentUser={user} onClose={completeOnboarding} />
      </div>
    );
  }

  return null;
}
