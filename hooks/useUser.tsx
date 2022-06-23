import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { LoggedInUser } from 'models';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type IContext = [
  user: LoggedInUser | null,
  setUser: (user: LoggedInUser | any) => void,
  isLoaded: boolean,
  setIsLoaded: (isLoaded: boolean) => void
];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined, false, () => undefined]);

export function UserProvider ({ children }: { children: ReactNode }) {
  const { account } = useWeb3React();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
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
  }, [account]);

  const value = useMemo(() => [user, setUser, isLoaded, setIsLoaded] as IContext, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
