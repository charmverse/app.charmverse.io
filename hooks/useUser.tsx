import { useWeb3React } from '@web3-react/core';
import { ReactNode, createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@prisma/client';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';

type IContext = [user: User | null, setUser: (user: User | any) => void, isLoaded: boolean];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined, false]);

export function UserProvider ({ children }: { children: ReactNode }) {

  const { account } = useWeb3React();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    if (account && !user) {
      setIsLoaded(false);
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
  console.log('USER!!!', user);
  const value = useMemo(() => [user, setUser, isLoaded] as const, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
