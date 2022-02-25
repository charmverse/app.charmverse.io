import { useWeb3React } from '@web3-react/core';
import { ReactNode, createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LoggedInUser } from 'models';
import charmClient from 'charmClient';
import useENSName from 'hooks/useENSName';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type IContext = [user: LoggedInUser | null, setUser: (user: LoggedInUser | any) => void, isLoaded: boolean];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined, false]);

export function UserProvider ({ children }: { children: ReactNode }) {

  const { account } = useWeb3React();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [space] = useCurrentSpace();
  const [isLoaded, setIsLoaded] = useState(false);
  const ensName = useENSName(account);

  useEffect(() => {
    if (account && !user) {
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
      // user disconnects their wallet
      setUser(null);
    }
  }, [account]);

  useEffect(() => {
    if (user && ensName && !user.ensName) {
      setUser({ ...user, ensName });
    }
  }, [user, ensName]);

  useEffect(() => {
    if (user && space) {
      const isAdmin = user.spaceRoles.some(role => role.role === 'admin' && role.spaceId === space?.id);
      setUser({ ...user, isAdmin });
    }
  }, [user, space]);

  const value = useMemo(() => [user, setUser, isLoaded] as const, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
