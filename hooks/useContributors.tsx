import charmClient from 'charmClient';
import type { Contributor } from 'models';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useCurrentSpace } from './useCurrentSpace';

export type { Contributor };

type Context = [users: Contributor[], setSpaces: (users: Contributor[]) => void];

const ContributorsContext = createContext<Readonly<Context>>([[], () => undefined]);

export function ContributorsProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();
  const [contributors, setContributors] = useState<Contributor[]>([]);

  const { data } = useSWR(() => space ? `users/${space?.id}` : null, (e) => {
    return charmClient.getContributors(space!.id);
  });

  useEffect(() => {
    setContributors(data || []);
  }, [data]);

  const value = useMemo(() => [contributors, setContributors] as Context, [contributors]);

  return (
    <ContributorsContext.Provider value={value}>
      {children}
    </ContributorsContext.Provider>
  );
}

export const useContributors = () => useContext(ContributorsContext);
