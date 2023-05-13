import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  memberId: string | null;
  setMemberId: Dispatch<SetStateAction<string | null>>;
  showUserProfile: (memberId: string) => void;
  hideUserProfile: VoidFunction;
}

const ContextElement = createContext<Readonly<Context>>({
  memberId: null,
  setMemberId: () => {},
  showUserProfile: () => {},
  hideUserProfile: () => {}
});

export const useUserProfile = () => useContext(ContextElement);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);

  function hideUserProfile() {
    setMemberId(null);
  }

  function showUserProfile(newUserProfileId: string) {
    setMemberId(newUserProfileId);
  }

  const value = useMemo(
    () => ({
      memberId,
      setMemberId,
      showUserProfile,
      hideUserProfile
    }),
    [memberId]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
