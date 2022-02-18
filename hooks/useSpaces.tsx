import { ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Space } from 'models';
import charmClient from 'charmClient';

type IContext = [spaces: Space[], setSpaces: (user: Space[]) => void];

export const SpacesContext = createContext<Readonly<IContext>>([[], () => undefined]);

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    charmClient.getSpaces()
      .then(_spaces => {
        setSpaces(_spaces);
      })
      .catch(err => {});
  }, []);

  const value = useMemo(() => [spaces, setSpaces] as const, [spaces]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
