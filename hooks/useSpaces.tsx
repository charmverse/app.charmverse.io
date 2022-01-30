import { ReactNode, createContext, useContext, useMemo } from 'react';
import { Space } from 'models';
import { spaces as spacesSeed } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

type IContext = [spaces: Space[], setSpaces: (user: Space[]) => void];

export const SpacesContext = createContext<Readonly<IContext>>([[], () => undefined]);

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const [spaces, setSpaces] = useLocalStorage<Space[]>('spaces', spacesSeed);

  const value = useMemo(() => [spaces, setSpaces] as const, [spaces]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
};

export const useSpaces = () => useContext(SpacesContext);
