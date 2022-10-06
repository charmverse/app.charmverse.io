import type { Prisma, Space } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';

import { useUser } from './useUser';

type IContext = {
  spaces: Space[];
  setSpaces: (spaces: Space[]) => void;
  isLoaded: boolean;
  createNewSpace: (data: Prisma.SpaceCreateInput) => Promise<void>;
};

export const SpacesContext = createContext<Readonly<IContext>>({
  spaces: [], setSpaces: () => undefined, isLoaded: false, createNewSpace: () => Promise.resolve()
});

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const { user, isLoaded: isUserLoaded, setUser } = useUser();
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

  const createNewSpace = useCallback(async (newSpace: Prisma.SpaceCreateInput) => {
    const space = await charmClient.createSpace(newSpace);
    setSpaces((s) => [...s, space]);
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    // give some time for spaces state to update or user will be redirected to /join in RouteGuard
    setTimeout(() => {
      router.push(`/${space.domain}`);
    }, 150);
  }, []);

  const value = useMemo(() => ({ spaces, setSpaces, isLoaded, createNewSpace }) as IContext, [spaces, isLoaded]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
