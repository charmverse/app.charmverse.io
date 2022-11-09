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
  loginFromWeb3Account: (address: string) => Promise<LoggedInUser>;
  refreshUserWithWeb3Account: () => Promise<void>;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => undefined,
  updateUser: () => undefined,
  isLoaded: false,
  setIsLoaded: () => undefined,
  loginFromWeb3Account: (address: string) => Promise.resolve() as any,
  refreshUserWithWeb3Account: () => Promise.resolve()
});

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account, sign, getStoredSignature, setLoggedInUser: setLoggedInUserForWeb3Hook } = useWeb3AuthSig();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  async function loginFromWeb3Account (address: string) {

    if (!address) {
      throw new MissingWeb3AccountError();
    }

    let signature = getStoredSignature(address) as AuthSig;

    if (!signature || !lowerCaseEqual(signature?.address, signature.address)) {
      signature = await sign();
    }

    try {
      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login({ address: signature.address, walletSignature: signature });

      setUser(refreshedProfile);

      return refreshedProfile;
    }
    catch (err) {
      const newProfile = await charmClient.createUser({ address, walletSignature: signature });
      setUser(newProfile);
      return newProfile;
    }
  }

  /**
   * Used to sync current user with current web 3 account
   *
   * Logs out current user if the web 3 account is not the same as the current user, otherwise refreshes them
   */
  async function refreshUserWithWeb3Account () {

    // a hack for now to support users that are trying to log in thru discord
    if ((!account || (account && !user?.wallets.some(w => w.address === account)))
    && !user?.discordUser) {
      await charmClient.logout();
      setUser(null);
    }
    else {
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
    refreshUserWithWeb3Account();
  }, [account]);

  const updateUser = useCallback((updatedUser: Partial<LoggedInUser>) => {
    setUser(u => u ? { ...u, ...updatedUser } : null);
  }, []);

  const value = useMemo<IContext>(() => {

    setLoggedInUserForWeb3Hook(user);

    return {
      user,
      setUser,
      isLoaded,
      setIsLoaded,
      updateUser,
      loginFromWeb3Account,
      refreshUserWithWeb3Account };
  }, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
