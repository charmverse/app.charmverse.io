import { ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import { useUser } from './useUser';

type IContext = [spaces: Space[], setSpaces: (user: Space[]) => void, isLoaded: boolean];

export const SpacesContext = createContext<Readonly<IContext>>([[], () => undefined, false]);

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const [user, _, isUserLoaded] = useUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('load spaces because user changed');
      setIsLoaded(false);
      charmClient.getSpaces()
        .then(_spaces => {
          setSpaces(_spaces);
          setIsLoaded(true);
        })
        .catch(err => {});
    }
    else if (isUserLoaded) {
      setIsLoaded(true);
    }
  }, [user?.id, isUserLoaded]);

  const value = useMemo(() => [spaces, setSpaces, isLoaded] as const, [spaces, isLoaded]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
