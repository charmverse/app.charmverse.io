import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import charmClient from 'charmClient';
import type { LoggedInUser } from 'models';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { lowerCaseEqual } from '../lib/utilities/strings';

type IContext = {
  user: LoggedInUser | null;
  setUser: (user: LoggedInUser | any) => void;
  updateUser: (user: Partial<LoggedInUser>) => void;
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => undefined,
  updateUser: () => undefined,
  isLoaded: false,
  setIsLoaded: () => undefined
});

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account } = useWeb3AuthSig();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  async function refreshUser (walletAddress: string) {
    if (user && !user?.addresses.some(a => lowerCaseEqual(a, walletAddress))) {
      await charmClient.logout();
      setUser(null);
    }
    else if (!user) {
      setIsLoaded(false);
      // try retrieving the user from session
      charmClient.getUser()
        .then(_user => {
          setUser(_user);
        })
        .finally(() => {
          setIsLoaded(true);
        });
    }
  }

  useEffect(() => {

    if (account) {
      refreshUser(account);
    }
  }, [account]);

  const updateUser = useCallback((updatedUser: Partial<LoggedInUser>) => {
    setUser(u => u ? { ...u, ...updatedUser } : null);
  }, []);

  const value = useMemo(() => ({ user, setUser, isLoaded, setIsLoaded, updateUser }) as IContext, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
