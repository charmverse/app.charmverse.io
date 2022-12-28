import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useMembers } from './useMembers';
import { useUser } from './useUser';

type IContext = {
  onboarded: boolean | null | undefined;
  completeOnboarding(): Promise<void>;
};

export const OnboardingContext = createContext<Readonly<IContext>>({
  onboarded: null,
  completeOnboarding: () => ({} as any)
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
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

  const value: IContext = useMemo(
    () => ({
      onboarded: isLoading || !user ? null : members.find((member) => member.id === user.id)?.onboarded ?? false,
      completeOnboarding
    }),
    [members]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => useContext(OnboardingContext);
