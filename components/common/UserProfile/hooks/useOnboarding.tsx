import charmClient from 'charmClient';
import { useMembers } from 'hooks/useMembers';
import type { LoggedInUser } from 'models';

type IContext = {
  showOnboardingFlow: boolean;
  completeOnboarding(): Promise<void>;
};

export function useOnboarding({ spaceId, user }: { spaceId?: string; user?: LoggedInUser }): IContext {
  const { members, mutateMembers, isValidating } = useMembers();
  const userId = user?.id;

  async function completeOnboarding() {
    if (userId && spaceId) {
      await charmClient.completeOnboarding({
        spaceId
      });
      mutateMembers(members.map((member) => (member.id === userId ? { ...member, onboarded: true } : member)));
    }
  }

  const userIsCurrentSpaceMember = !!user?.spaceRoles.some((sr) => sr.spaceId === spaceId);
  const showOnboardingFlow =
    userIsCurrentSpaceMember &&
    !isValidating &&
    members.length > 0 &&
    !members.find((member) => member.id === userId)?.onboarded;

  return {
    showOnboardingFlow,
    completeOnboarding
  };
}
