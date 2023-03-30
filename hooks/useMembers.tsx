import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useMemo } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { Member } from 'lib/members/interfaces';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  members: Member[];
  membersRecord: Record<string, Member>;
  guests: Member[];
  mutateMembers: KeyedMutator<Member[]>;
  removeGuest: (userId: string) => Promise<void>;
  isLoading: boolean;
  getMemberById: (id?: string | null) => Member | undefined;
};

const MembersContext = createContext<Readonly<Context>>({
  members: [],
  membersRecord: {},
  guests: [],
  isLoading: false,
  mutateMembers: () => Promise.resolve(undefined),
  removeGuest: () => Promise.resolve(undefined),
  getMemberById: () => undefined
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

  const membersRecord = useMemo(() => {
    return (
      members?.reduce<Record<string, Member>>((cur, member) => {
        cur[member.id] = member;
        return cur;
      }, {}) || {}
    );
  }, [members]);

  const getMemberById = useCallback((id?: string | null) => (id ? membersRecord[id] : undefined), [membersRecord]);

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
      membersRecord,
      guests: members?.filter((member) => member.isGuest) || [],
      mutateMembers,
      removeGuest,
      getMemberById,
      isLoading
    }),
    [members, membersRecord, getMemberById]
  );

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>;
}

export const useMembers = () => useContext(MembersContext);
