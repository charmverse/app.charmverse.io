import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import useENSName from 'hooks/useENSName';
import { LoggedInUser } from 'models';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type IContext = [user: LoggedInUser | null, setUser: (user: LoggedInUser | any) => void, isLoaded: boolean];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined, false]);

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account } = useWeb3React();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const ensName = useENSName(account);

  useEffect(() => {
    if (account && !user) {
      setIsLoaded(false);
      charmClient.getUser()
        .then(_user => {
          setUser(_user);
          setIsLoaded(true);
        })
        .catch(err => {
          // probably needs to log in
          setIsLoaded(true);
        });
    }
    else if (!account) {
      console.log('no account');
      // user disconnects their wallet
      setUser(null);
      setIsLoaded(true);
    }
  }, [account]);

  useEffect(() => {
    if (user && ensName && !user.ensName) {
      setUser({ ...user, ensName });
    }
  }, [user, ensName]);

  const value = useMemo(() => [user, setUser, isLoaded] as const, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
