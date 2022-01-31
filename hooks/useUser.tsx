import { ReactNode, createContext, useContext, useMemo } from 'react';
import { Contributor } from 'models';
import { activeUser } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

type IContext = [user: Contributor | null, setUser: (user: Contributor | any) => void];

export const UserContext = createContext<Readonly<IContext>>([null, () => undefined]);

export function UserProvider ({ children }: { children: ReactNode }) {

  const [user, setUser] = useLocalStorage<Contributor>('profile', activeUser);

  const value = useMemo(() => [user, setUser] as const, [user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
