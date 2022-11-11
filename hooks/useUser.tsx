import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig, AuthSigWithRawAddress } from 'lib/blockchain/interfaces';
import { MissingWeb3AccountError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

type IContext = {
  user: LoggedInUser | null;
  setUser: (user: LoggedInUser | any) => void;
  updateUser: (user: Partial<LoggedInUser>) => void;
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
  loginFromWeb3Account: (authSig?: AuthSigWithRawAddress) => Promise<LoggedInUser>;
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
  const { account, sign, getStoredSignature, setLoggedInUser: setLoggedInUserForWeb3Hook, verifiableWalletDetected } = useWeb3AuthSig();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  async function loginFromWeb3Account (authSig?: AuthSigWithRawAddress) {

    if (!verifiableWalletDetected && !authSig) {
      throw new MissingWeb3AccountError();
    }

    let signature = authSig ?? getStoredSignature() as AuthSigWithRawAddress;

    if (!signature || !lowerCaseEqual(signature?.address, signature.address) || !signature.rawAddress) {
      signature = await sign();
    }

    try {
      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login({ address: signature.rawAddress, walletSignature: signature });

      setUser(refreshedProfile);

      return refreshedProfile;
    }
    catch (err) {
      const newProfile = await charmClient.createUser({ address: signature.rawAddress, walletSignature: signature });
      setUser(newProfile);
      return newProfile;
    }
  }

  async function logoutUser () {
    await charmClient.logout();
    setUser(null);
  }

  /**
   * Used to sync current user with current web 3 account
   *
   * Logs out current user if the web 3 account is not the same as the current user, otherwise refreshes them
   */
  async function refreshUserWithWeb3Account () {

    const signature = getStoredSignature();

    // Support the initial load
    if (!isLoaded
      || (account && !user?.wallets.some(w => lowerCaseEqual(w.address, account)) && lowerCaseEqual(signature?.address, account))
      || user?.discordUser) {
      charmClient.getUser()
        .then(_user => {
          setUser(_user);
        })
        .finally(() => {
          setIsLoaded(true);
        });
      // a hack for now to support users that are trying to log in thru discord
    }
    else if (verifiableWalletDetected && signature) {
      loginFromWeb3Account(signature)
        .then(loggedInUser => setUser(loggedInUser))
        .catch(logoutUser);
    }
    else {
      logoutUser();
    }
  }

  useEffect(() => {
    refreshUserWithWeb3Account();

  }, [account]);

  const updateUser = useCallback((updatedUser: Partial<LoggedInUser>) => {
    setUser(u => u ? { ...u, ...updatedUser } : null);
  }, []);

  useEffect(() => {
    setLoggedInUserForWeb3Hook(user);
  }, [user]);

  const value = useMemo<IContext>(() => {

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
