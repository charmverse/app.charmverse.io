import type { Prisma, Space } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';

import { useUser } from './useUser';

type IContext = {
  spaces: Space[];
  setSpace: (spaces: Space) => void;
  setSpaces: (spaces: Space[]) => void;
  isLoaded: boolean;
  createNewSpace: (data: Prisma.SpaceCreateInput) => Promise<Space | null>;
  isCreatingSpace: boolean;
};

export const SpacesContext = createContext<Readonly<IContext>>({
  spaces: [],
  setSpace: () => undefined,
  setSpaces: () => undefined,
  isLoaded: false,
  createNewSpace: () => Promise.resolve(null),
  isCreatingSpace: false
});

export function SpacesProvider ({ children }: { children: ReactNode }) {

  const { user, isLoaded: isUserLoaded, setUser } = useUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
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
    setIsCreatingSpace(true);

    try {
      const space = await charmClient.createSpace(newSpace);
      setSpaces((s) => [...s, space]);
      // refresh user permissions
      const _user = await charmClient.getUser();
      setUser(_user);
      // give some time for spaces state to update or user will be redirected to /join in RouteGuard
      setTimeout(() => {
        router.push(`/${space.domain}`);
        setIsCreatingSpace(false);
      }, 200);
      return space;
    }
    catch (e) {
      setIsCreatingSpace(false);
    }

    return null;
  }, []);

  const setSpace = useCallback((_space: Space) => {
    const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
    setSpaces(newSpaces);
  }, [spaces, setSpaces]);

  const value = useMemo(() => ({
    spaces,
    setSpace,
    setSpaces,
    isLoaded,
    createNewSpace,
    isCreatingSpace
  }) as IContext, [spaces, isLoaded, isCreatingSpace]);

  return (
    <SpacesContext.Provider value={value}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpaces = () => useContext(SpacesContext);
