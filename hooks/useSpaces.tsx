import { ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import { useUser } from './useUser';

type IContext = [spaces: Space[], setSpaces: (user: Space[]) => void];

export const SpacesContext = createContext<Readonly<IContext>>([[], () => undefined]);

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const [user] = useUser();
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    if (user) {
      charmClient.getSpaces()
        .then(_spaces => {
          setSpaces(_spaces);
        })
        .catch(err => {});
    }
  }, [user?.id]);

  const value = useMemo(() => [spaces, setSpaces] as const, [spaces]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
