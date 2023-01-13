import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import type { LoggedInUser } from 'models';

type IContext = {
  user: LoggedInUser | null;
  setUser: (user: LoggedInUser | any) => void;
  updateUser: (user: Partial<LoggedInUser>) => void;
  isLoaded: boolean;
  refreshUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => undefined,
  updateUser: () => undefined,
  isLoaded: false,
  refreshUser: () => Promise.resolve(),
  logoutUser: () => Promise.resolve()
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  async function logoutUser() {
    await charmClient.logout();
    setUser(null);
  }

  /**
   * Used to sync current user with current web 3 account
   *
   * Logs out current user if the web 3 account is not the same as the current user, otherwise refreshes them
   */
  async function refreshUser() {
    charmClient
      .getUser()
      .then((_user) => {
        setUser(_user);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }

  useEffect(() => {
    refreshUser();
  }, []);

  const updateUser = useCallback((updatedUser: Partial<LoggedInUser>) => {
    setUser((u) => (u ? { ...u, ...updatedUser } : null));
  }, []);

  useEffect(() => {
    if (user?.deletedAt) {
      charmClient.logout().then(() => {
        window.location.href = window.location.origin;
      });
    }
  }, [user]);

  const value = useMemo<IContext>(() => {
    return {
      user,
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
