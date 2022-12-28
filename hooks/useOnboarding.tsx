import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
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
  const { user, setUser } = useUser();
  const currentSpace = useCurrentSpace();

  async function completeOnboarding() {
    if (currentSpace) {
      charmClient.completeOnboarding({
        spaceId: currentSpace.id
      });
      setUser({ ...user, onboarded: true });
    }
  }

  const value: IContext = useMemo(
    () => ({
      onboarded: user?.onboarded,
      completeOnboarding
    }),
    [user?.onboarded]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => useContext(OnboardingContext);
