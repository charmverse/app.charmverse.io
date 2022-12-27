import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { Member } from 'lib/members/interfaces';
import { shortWalletAddress } from 'lib/utilities/strings';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  members: Member[];
  mutateMembers: KeyedMutator<Member[]>;
};

const MembersContext = createContext<Readonly<Context>>({
  members: [],
  mutateMembers: () => Promise.resolve(undefined)
});

export function MembersProvider({ children }: { children: ReactNode }) {
  const space = useCurrentSpace();

  const { data: members, mutate: mutateMembers } = useSWR(
    () => (space ? `members/${space?.id}` : null),
    () => {
      return charmClient.members.getMembers(space!.id).then((_members) =>
        _members.map((m) => {
          if (m.identityType === 'Wallet') {
            m.username = shortWalletAddress(m.username);
          }
          return m;
        })
      );
    }
  );

  const value = useMemo(() => ({ members: members || [], mutateMembers } as Context), [members]);

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>;
}

export const useMembers = () => useContext(MembersContext);
