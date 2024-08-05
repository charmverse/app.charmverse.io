import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  memberId: string | null;
  showUserProfile: (memberId: string) => void;
  hideUserProfile: VoidFunction;
  openEditProfile: VoidFunction;
  closeEditProfile: VoidFunction;
  isEditProfileOpen: boolean;
}

const ContextElement = createContext<Readonly<Context>>({
  memberId: null,
  showUserProfile: () => {},
  hideUserProfile: () => {},
  openEditProfile: () => {},
  closeEditProfile: () => {},
  isEditProfileOpen: false
});

export const useMemberProfileDialog = () => useContext(ContextElement);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  function hideUserProfile() {
    setMemberId(null);
  }

  function showUserProfile(newUserProfileId: string) {
    setMemberId(newUserProfileId);
  }

  function openEditProfile() {
    setIsEditProfileOpen(true);
  }

  function closeEditProfile() {
    setIsEditProfileOpen(false);
  }

  const value = useMemo(
    () => ({
      memberId,
      showUserProfile,
      hideUserProfile,
      openEditProfile,
      closeEditProfile,
      isEditProfileOpen
    }),
    [memberId, isEditProfileOpen]
  );

  return <ContextElement.Provider value={value}>{children}</ContextElement.Provider>;
}
