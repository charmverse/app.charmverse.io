import { createContext, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Space } from 'models';
import { spaces as spacesSeed } from 'seedData';

type IContext = [spaces: Space[], setSpaces: (user: Space[]) => void];

export const SpacesContext = createContext<IContext>([[], () => void 0]);

export const SpacesProvider: React.FC = ({ children }) => {

  const [spaces, setSpaces] = useLocalStorage<Space[]>(`spaces`, spacesSeed);

  return (
    <SpacesContext.Provider value={[spaces, setSpaces]}>
      {children}
    </SpacesContext.Provider>
  );
};

export const useSpaces = () => useContext(SpacesContext);
