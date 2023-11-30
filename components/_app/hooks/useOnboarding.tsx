import charmClient from 'charmClient';
import { useMembers } from 'hooks/useMembers';
import type { LoggedInUser } from 'models';

export function useOnboarding({ spaceId, user }: { spaceId?: string; user: LoggedInUser | null }) {
  const { members, mutateMembers, isValidating: isLoadingMembersForSpace } = useMembers();
  const userId = user?.id;

  async function completeOnboarding() {
    if (userId && spaceId) {
      await charmClient.spaces.completeOnboarding({
        spaceId
      });
      mutateMembers(members.map((member) => (member.id === userId ? { ...member, onboarded: true } : member)));
    }
  }

  const spaceMember = members.find((member) => member.id === userId);
  const showOnboardingFlow =
    !isLoadingMembersForSpace && !!spaceMember && !spaceMember.isGuest && spaceMember.onboarded === false;

  return {
    isGuest: spaceMember?.isGuest,
    showOnboardingFlow,
    completeOnboarding
  };
}
