import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useLocalStorage } from './useLocalStorage';
import { useUser } from './useUser';

type IContext = {
  onboarding: boolean;
  setOnboarding: Dispatch<SetStateAction<boolean>>;
}

export const OnboardingContext = createContext<Readonly<IContext>>({
  onboarding: false,
  setOnboarding: () => {}
});

export function OnboardingProvider ({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [onboarding, setOnboarding] = useLocalStorage(user ? `onboarding-${user.id}` : null, false);

  const value: IContext = useMemo(() => ({
    onboarding,
    setOnboarding
  }), [onboarding]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
