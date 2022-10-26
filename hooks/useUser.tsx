import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { MissingWeb3AccountError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

type IContext = {
  user: LoggedInUser | null;
  setUser: (user: LoggedInUser | any) => void;
  updateUser: (user: Partial<LoggedInUser>) => void;
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
  loginFromWeb3Account: () => Promise<LoggedInUser>;
  refreshUserWithWeb3Account: () => Promise<void>;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => undefined,
  updateUser: () => undefined,
  isLoaded: false,
  setIsLoaded: () => undefined,
  loginFromWeb3Account: () => Promise.resolve() as any,
  refreshUserWithWeb3Account: () => Promise.resolve()
});

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account, sign, getStoredSignature } = useWeb3AuthSig();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  async function loginFromWeb3Account () {

    if (!account) {
      throw new MissingWeb3AccountError();
    }

    let signature = getStoredSignature(account) as AuthSig;

    if (!signature || !lowerCaseEqual(signature?.address, account)) {
      signature = await sign();
    }

    try {
      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login({ address: account, walletSignature: signature });

      setUser(refreshedProfile);

      return refreshedProfile;
    }
    catch (err) {
      const newProfile = await charmClient.createUser({ address: account as string, walletSignature: signature });
      setUser(newProfile);
      return newProfile;
    }
  }

  function getCharmUser () {
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

  /**
   * Used to sync current user with current web 3 account
   *
   * Logs out current user if the web 3 account is not the same as the current user, otherwise refreshes them
   */
  async function refreshUserWithWeb3Account (address: string) {
    // a hack for now to support users that are trying to log in thru discord
    if (user && !user?.wallets.some(w => lowerCaseEqual(w.address, address))) {
      await charmClient.logout();
      setUser(null);
    }
    else {
      getCharmUser();
    }
  }

  useEffect(() => {
    if (account) {
      refreshUserWithWeb3Account(account);
    }
    else {
      getCharmUser();
    }
  }, [account]);

  const updateUser = useCallback((updatedUser: Partial<LoggedInUser>) => {
    setUser(u => u ? { ...u, ...updatedUser } : null);
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    isLoaded,
    setIsLoaded,
    updateUser,
    loginFromWeb3Account,
    refreshUserWithWeb3Account }) as IContext, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
