import type { Member } from 'lib/members/interfaces';

import { createMockUser } from './user';

export function createMockSpaceMember(user = createMockUser()): Member {
  return {
    ...user,
    avatarTokenId: user.avatarTokenId ?? undefined,
    avatar: user.avatar ?? undefined,
    deletedAt: user.deletedAt ?? undefined,
    isBot: user.isBot ?? false,
    joinDate: '',
    onboarded: true,
    profile: undefined,
    properties: [],
    searchValue: user.username,
    roles: []
  };
}
