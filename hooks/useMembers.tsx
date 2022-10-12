import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { Member } from 'models';

import { useCurrentSpace } from './useCurrentSpace';

export type { Member };

type Context = [users: Member[], setSpaces: (users: Member[]) => void];

const MembersContext = createContext<Readonly<Context>>([[], () => undefined]);

export function MembersProvider ({ children }: { children: ReactNode }) {
  const [space] = useCurrentSpace();
  const [members, setMembers] = useState<Member[]>([]);

  const { data } = useSWR(() => space ? `users/${space?.id}` : null, (e) => {
    return charmClient.getMembers(space!.id);
  });

  useEffect(() => {
    setMembers(data || []);
  }, [data]);

  const value = useMemo(() => [members, setMembers] as Context, [members]);

  return (
    <MembersContext.Provider value={value}>
      {children}
    </MembersContext.Provider>
  );
}

export const useMembers = () => useContext(MembersContext);
