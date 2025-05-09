import type { ReactNode } from 'react';
import { useCallback, createContext, useContext, useMemo } from 'react';
import type { KeyedMutator } from 'swr';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { Member } from '@packages/lib/members/interfaces';

import { useCurrentSpace } from './useCurrentSpace';

type Context = {
  members: Member[];
  membersRecord: Record<string, Member>;
  guests: Member[];
  mutateMembers: KeyedMutator<Member[]>;
  removeGuest: (userId: string) => Promise<void>;
  makeAdmin: (userIds: string[]) => Promise<void>;
  makeGuest: (userIds: string[]) => Promise<void>;
  makeMember: (userIds: string[]) => Promise<void>;
  removeFromSpace: (userId: string) => Promise<void>;
  banFromSpace: (userId: string) => Promise<void>;
  isLoading: boolean;
  isValidating: boolean;
  getMemberById: (id?: string | null) => Member | undefined;
};

const MembersContext = createContext<Readonly<Context>>({
  members: [],
  membersRecord: {},
  guests: [],
  isLoading: false,
  isValidating: false,
  mutateMembers: () => Promise.resolve(undefined),
  removeGuest: () => Promise.resolve(),
  makeAdmin: () => Promise.resolve(),
  makeGuest: () => Promise.resolve(),
  makeMember: () => Promise.resolve(),
  removeFromSpace: () => Promise.resolve(),
  banFromSpace: () => Promise.resolve(),
  getMemberById: () => undefined
});

export function MembersProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();

  const {
    data: members,
    mutate: mutateMembers,
    isLoading,
    isValidating
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
      await charmClient.members.removeMember({
        spaceId: space.id,
        userId
      });
      mutateMembers();
    }
  }

  async function makeAdmin(userIds: string[]) {
    if (space) {
      for (const userId of userIds) {
        await charmClient.members.updateMemberRole({ spaceId: space.id, userId, isAdmin: true, isGuest: false });
      }
      mutateMembers(
        (_members) => _members?.map((c) => (userIds.includes(c.id) ? { ...c, isAdmin: true, isGuest: false } : c)),
        { revalidate: false }
      );
    }
  }

  async function makeGuest(userIds: string[]) {
    if (space) {
      for (const userId of userIds) {
        await charmClient.members.updateMemberRole({ spaceId: space.id, userId, isAdmin: false, isGuest: true });
      }
      mutateMembers(
        (_members) => _members?.map((c) => (userIds.includes(c.id) ? { ...c, isAdmin: false, isGuest: true } : c)),
        { revalidate: false }
      );
    }
  }

  async function makeMember(userIds: string[]) {
    if (space) {
      for (const userId of userIds) {
        await charmClient.members.updateMemberRole({ spaceId: space.id, userId, isAdmin: false, isGuest: false });
      }
      mutateMembers(
        (_members) => _members?.map((c) => (userIds.includes(c.id) ? { ...c, isAdmin: false, isGuest: false } : c)),
        { revalidate: false }
      );
    }
  }

  async function removeFromSpace(userId: string) {
    if (!space) {
      throw new Error('Space not found');
    }
    await charmClient.members.removeMember({ spaceId: space.id, userId });
    mutateMembers((_members) => _members?.filter((c) => c.id !== userId), { revalidate: false });
  }

  async function banFromSpace(userId: string) {
    if (!space) {
      throw new Error('Space not found');
    }
    await charmClient.members.banMember({ spaceId: space.id, userId });
    mutateMembers((_members) => _members?.filter((c) => c.id !== userId), { revalidate: false });
  }

  const value = useMemo(
    () => ({
      members:
        members?.map((member) => ({
          ...member,
          roles: [
            ...member.roles,
            {
              id: member.isAdmin ? 'admin' : member.isGuest ? 'guest' : 'member',
              name: member.isAdmin ? 'Admin' : member.isGuest ? 'Guest' : 'Member'
            }
          ]
        })) || [],
      membersRecord,
      guests: members?.filter((member) => member.isGuest) || [],
      mutateMembers,
      makeAdmin,
      makeGuest,
      makeMember,
      removeGuest,
      removeFromSpace,
      isLoading,
      isValidating,
      getMemberById,
      banFromSpace
    }),
    [members, membersRecord, getMemberById]
  );

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>;
}

export const useMembers = () => useContext(MembersContext);
