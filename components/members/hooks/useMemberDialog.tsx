import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  memberId: string | null;
  showUserId: (memberId: string) => void;
  hideUserProfile: VoidFunction;
}

const ContextElement = createContext<Readonly<Context>>({
  memberId: null,
  showUserId: () => {},
  hideUserProfile: () => {}
});

export const useMemberDialog = () => useContext(ContextElement);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);

  function hideUserProfile() {
    setMemberId(null);
  }

  function showUserId(newUserProfileId: string) {
    setMemberId(newUserProfileId);
  }

  const value = useMemo(
    () => ({
      memberId,
      showUserId,
      hideUserProfile
    }),
    [memberId]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
