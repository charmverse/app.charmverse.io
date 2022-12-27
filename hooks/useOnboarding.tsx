import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type IContext = {
  onboarding: boolean | null | undefined;
  completeOnboarding(): Promise<void>;
};

export const OnboardingContext = createContext<Readonly<IContext>>({
  onboarding: null,
  completeOnboarding: () => ({} as any)
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const { data: onboarding, mutate: updateOnboarding } = useSWR(
    user && currentSpace ? `onboarding-${user.id}-${currentSpace.id}` : null,
    () =>
      charmClient.workspaceOnboarding.getWorkspaceOnboarding({
        spaceId: currentSpace!.id
      })
  );

  async function completeOnboarding() {
    if (currentSpace) {
      charmClient.workspaceOnboarding.completeOnboarding({
        spaceId: currentSpace.id
      });
      updateOnboarding(
        (_onboarding) => {
          if (_onboarding) {
            return true;
          }
        },
        { revalidate: false }
      );
    }
  }

  const value: IContext = useMemo(
    () => ({
      onboarding,
      completeOnboarding
    }),
    [onboarding]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => useContext(OnboardingContext);
