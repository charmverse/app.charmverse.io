import type { Space } from '@prisma/client';
import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import type { CreateSpaceProps } from 'lib/spaces/createWorkspace';

import { useUser } from './useUser';

/**
 * @memberSpaces - Subset of spaces where user is not a guest (ie. they are normal member or admin)
 */
type IContext = {
  spaces: Space[];
  memberSpaces: Space[];
  setSpace: (spaces: Space) => void;
  setSpaces: (spaces: Space[]) => void;
  isLoaded: boolean;
  createNewSpace: (data: Pick<CreateSpaceProps, 'createSpaceOption' | 'spaceData'>) => Promise<Space>;
  isCreatingSpace: boolean;
};

export const SpacesContext = createContext<Readonly<IContext>>({
  spaces: [],
  memberSpaces: [],
  setSpace: () => undefined,
  setSpaces: () => undefined,
  isLoaded: false,
  createNewSpace: () => Promise.reject(),
  isCreatingSpace: false
});

export function SpacesProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded, setUser } = useUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoaded(false);
      charmClient
        .getSpaces()
        .then((_spaces) => {
          setSpaces(_spaces);
        })
        .catch((err) => {})
        .finally(() => setIsLoaded(true));
    } else if (isUserLoaded) {
      setIsLoaded(true);
    }
  }, [user?.id, isUserLoaded]);

  const createNewSpace = useCallback(async (newSpace: Pick<CreateSpaceProps, 'createSpaceOption' | 'spaceData'>) => {
    setIsCreatingSpace(true);

    try {
      const space = await charmClient.createSpace(newSpace);
      setSpaces((s) => [...s, space]);
      // refresh user permissions
      const _user = await charmClient.getUser();
      setUser(_user);
      setIsCreatingSpace(false);
      return space;
    } catch (e) {
      setIsCreatingSpace(false);
      throw e;
    }
  }, []);

  const setSpace = useCallback(
    (_space: Space) => {
      const newSpaces = spaces.map((s) => (s.id === _space.id ? _space : s));
      setSpaces(newSpaces);
    },
    [spaces, setSpaces]
  );

  const memberSpaces = !user
    ? []
    : spaces.filter((s) => !!user?.spaceRoles.find((sr) => sr.spaceId === s.id && !sr.isGuest));

  const value = useMemo(
    () =>
      ({
        spaces,
        memberSpaces,
        setSpace,
        setSpaces,
        isLoaded,
        createNewSpace,
        isCreatingSpace
      } as IContext),
    [spaces, isLoaded, isCreatingSpace]
  );

  return <SpacesContext.Provider value={value}>{children}</SpacesContext.Provider>;
}

export const useSpaces = () => useContext(SpacesContext);
