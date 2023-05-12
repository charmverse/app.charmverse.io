import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

type IContext = {
  onboarded: boolean | null | undefined;
  completeOnboarding(): Promise<void>;
};

export function useOnboarding(): IContext {
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { members, mutateMembers, isLoading } = useMembers();

  async function completeOnboarding() {
    if (currentSpace && user) {
      await charmClient.completeOnboarding({
        spaceId: currentSpace.id
      });
      mutateMembers(members.map((member) => (member.id === user.id ? { ...member, onboarded: true } : member)));
    }
  }

  const onboarded = isLoading || !user ? null : members.find((member) => member.id === user.id)?.onboarded ?? false;

  return {
    onboarded,
    completeOnboarding
  };
}
