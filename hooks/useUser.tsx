import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';

import { useGetTriggerUser, useLogout } from 'charmClient/hooks/profile';

export type IContext = {
  user: LoggedInUser | null;
  setUser: (user: Partial<LoggedInUser>) => Promise<LoggedInUser | null | undefined>;
  updateUser: (user: Partial<LoggedInUser>) => Promise<LoggedInUser | null | undefined>;
  isLoaded: boolean;
  refreshUser: () => Promise<LoggedInUser | null | undefined>;
  logoutUser: () => Promise<void>;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => Promise.resolve(undefined),
  updateUser: () => Promise.resolve(undefined),
  isLoaded: false,
  refreshUser: () => Promise.resolve(undefined),
  logoutUser: () => Promise.resolve()
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: user, trigger: getUser, error: userError } = useGetTriggerUser();
  const { trigger: logout } = useLogout();
  const isLoaded = user !== undefined || !!userError;

  async function logoutUser() {
    await logout();
    window.location.href = window.location.origin;
  }

  async function refreshUser(updates: Partial<LoggedInUser> = {}) {
    return getUser(undefined, {
      optimisticData: (_user) => {
        return _user ? { ..._user, ...updates } : null;
      },
      onSuccess: async (_user) => {
        if (_user?.deletedAt) {
          await logoutUser();
        }
      }
    });
  }

  useEffect(() => {
    refreshUser();
  }, []);

  const updateUser = async (updatedUser: Partial<LoggedInUser>) => refreshUser(updatedUser);
  const setUser = async (updatedUser: Partial<LoggedInUser>) => refreshUser(updatedUser);

  const value = useMemo<IContext>(() => {
    return {
      user: user || null,
      setUser,
      isLoaded,
      updateUser,
      refreshUser,
      logoutUser
    };
  }, [user, isLoaded]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
