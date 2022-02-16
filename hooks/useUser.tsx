import { useWeb3React } from '@web3-react/core';
import { ReactNode, createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LoggedInUser } from 'models';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';

type IContext = [user: LoggedInUser | null, setUser: (user: LoggedInUser | any) => void, isLoaded: boolean];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined, false]);

export function UserProvider ({ children }: { children: ReactNode }) {

  const { account } = useWeb3React();
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (account && !user) {
      charmClient.getUser()
        .then(_user => {
          setUser(_user);
          setIsLoaded(true);
          router.push('/');
        })
        .catch(err => {
          // probably needs to log in
          setIsLoaded(true);
        });
    }
  }, [account]);

  const value = useMemo(() => [user, setUser, isLoaded] as const, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
