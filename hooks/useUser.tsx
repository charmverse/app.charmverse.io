import { createContext, useContext } from 'react';
import { Contributor } from 'models';
import { activeUser } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

type IContext = [user: Contributor | null, setUser: (user: Contributor | any) => void];

export const UserContext = createContext<IContext>([null, () => void 0]);

export const UserProvider: React.FC = ({ children }) => {

  const [user, setUser] = useLocalStorage<Contributor>(`profile`, activeUser);

  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
