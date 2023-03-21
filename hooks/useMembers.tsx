import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { Member } from 'lib/members/interfaces';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  members: Member[];
  guests: Member[];
  mutateMembers: KeyedMutator<Member[]>;
  removeGuest: (userId: string) => Promise<void>;
  isLoading: boolean;
};

const MembersContext = createContext<Readonly<Context>>({
  members: [],
  guests: [],
  isLoading: false,
  mutateMembers: () => Promise.resolve(undefined),
  removeGuest: () => Promise.resolve(undefined)
});

export function MembersProvider({ children }: { children: ReactNode }) {
  const space = useCurrentSpace();

  const {
    data: members,
    mutate: mutateMembers,
    isLoading
  } = useSWR(
    () => (space ? `members/${space?.id}` : null),
    () => {
      return charmClient.members.getMembers(space!.id);
    }
  );

  async function removeGuest(userId: string) {
    if (space) {
      await charmClient.members.removeGuest({
        spaceId: space.id,
        userId
      });
      mutateMembers();
    }
  }

  const value = useMemo(
    () => ({
      members: members || [],
      guests: members?.filter((member) => member.isGuest) || [],
      mutateMembers,
      removeGuest,
      isLoading
    }),
    [members]
  );

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>;
}

export const useMembers = () => useContext(MembersContext);
