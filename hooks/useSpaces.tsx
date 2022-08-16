import { ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import charmClient from 'charmClient';
import { useUser } from './useUser';

type IContext = [spaces: Space[], setSpaces: (spaces: Space[]) => void, isLoaded: boolean];

export const SpacesContext = createContext<Readonly<IContext>>([[], () => undefined, false]);

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const { user, isLoaded: isUserLoaded } = useUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user && router.route !== '/share/[...pageId]') {
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

  const value = useMemo(() => [spaces, setSpaces, isLoaded] as IContext, [spaces, isLoaded]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
