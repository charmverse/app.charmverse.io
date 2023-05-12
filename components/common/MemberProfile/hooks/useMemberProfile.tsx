import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  memberId: string | null;
  setMemberId: Dispatch<SetStateAction<string | null>>;
  showMemberProfile: (memberId: string) => void;
  hideMemberProfile: VoidFunction;
}

const ContextElement = createContext<Readonly<Context>>({
  memberId: null,
  setMemberId: () => {},
  showMemberProfile: () => {},
  hideMemberProfile: () => {}
});

export const useMemberProfile = () => useContext(ContextElement);

export function MemberProfileProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);

  function hideMemberProfile() {
    setMemberId(null);
  }

  function showMemberProfile(newMemberProfileId: string) {
    setMemberId(newMemberProfileId);
  }

  const value = useMemo(
    () => ({
      memberId,
      setMemberId,
      showMemberProfile,
      hideMemberProfile
    }),
    [memberId]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
