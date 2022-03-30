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
    else if (account && user) {
      // Dont continue if the user already have an address
      if (user.addresses.length === 0) {
        setIsLoaded(false);
        charmClient.login(account).then(_user => {
          // Another account is associated with this wallet address so set it as the new user
          setUser(_user);
          setIsLoaded(true);
        }).catch(err => {
          setIsLoaded(false);
          // No user is connected with this wallet address, so update the current user to have this address
          charmClient.updateUser({
            userId: user.id,
            address: account
          }).then((_user) => {
            setUser(_user);
            setIsLoaded(true);
          }).catch(() => {
            setIsLoaded(true);
          });
        });
      }
    }
    // user disconnects their wallet
    else if (!account) {
      setIsLoaded(true);
    }
  }, [account]);

  useEffect(() => {
    if (user && ensName && !user.ensName) {
      setUser({ ...user, ensName });
    }
  }, [user, ensName]);

  const value = useMemo(() => [user, setUser, isLoaded] as IContext, [user, isLoaded]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
