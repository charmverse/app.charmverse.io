import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import charmClient from 'charmClient';
import type { LoggedInUser } from 'models';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { lowerCaseEqual } from '../lib/utilities/strings';
import { MissingWeb3AccountError, MissingWeb3SignatureError } from '../lib/utilities/errors';
import type { AuthSig } from '../lib/blockchain/interfaces';

type IContext = {
  user: LoggedInUser | null;
  setUser: (user: LoggedInUser | any) => void;
  updateUser: (user: Partial<LoggedInUser>) => void;
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
  loginFromWeb3Account:() => Promise<LoggedInUser>;
};

export const UserContext = createContext<Readonly<IContext>>({
  user: null,
  setUser: () => undefined,
  updateUser: () => undefined,
  isLoaded: false,
  setIsLoaded: () => undefined,
  loginFromWeb3Account: () => Promise.resolve() as any
});

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account, walletAuthSignature, sign } = useWeb3AuthSig();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  async function loginFromWeb3Account () {

    let signature = walletAuthSignature as AuthSig;

    if (!account) {
      throw new MissingWeb3AccountError();
    }
    else if (!walletAuthSignature) {
      signature = await sign();
    }

    try {
      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login({ address: account, walletSignature: signature });

      setUser(refreshedProfile);

      return refreshedProfile;
    }
    catch (err) {
      const newProfile = await charmClient.login({ address: account as string, walletSignature: signature });
      setUser(newProfile);
      return newProfile;
    }
  }

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

  const value = useMemo(() => ({ user, setUser, isLoaded, setIsLoaded, updateUser, loginFromWeb3Account }) as IContext, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
