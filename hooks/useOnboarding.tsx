import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';

type IContext = {
  onboarding: Record<string, boolean>;
  showOnboarding: (spaceId: string) => void;
  hideOnboarding: (spaceId: string) => void;
}

export const OnboardingContext = createContext<Readonly<IContext>>({
  onboarding: {},
  showOnboarding: () => {},
  hideOnboarding: () => {}
});

export function OnboardingProvider ({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [onboarding, setOnboarding] = useLocalStorage(user ? `onboarding-${user.id}` : null, {});

  function showOnboarding (spaceId: string) {
    setOnboarding((_onboarding) => ({
      ..._onboarding,
      [spaceId]: true
    }));
  }

  function hideOnboarding (spaceId: string) {
    setOnboarding((_onboarding) => ({
      ..._onboarding,
      [spaceId]: false
    }));
  }

  const value: IContext = useMemo(() => ({
    onboarding,
    showOnboarding,
    hideOnboarding
  }), [onboarding]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
