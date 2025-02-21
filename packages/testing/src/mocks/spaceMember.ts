import type { Social, Member } from '@root/lib/members/interfaces';

import { createMockUser } from './user';

const joinDate = new Date('2023-07-19T00:00:00.000Z').toISOString();

export function createMockSpaceMember(user = createMockUser()): Member {
  const username = user.username.toLocaleLowerCase().replace(' ', '_');
  return {
    ...user,
    farcasterUser: undefined,
    avatarTokenId: user.avatarTokenId ?? undefined,
    avatar: user.avatar ?? undefined,
    deletedAt: user.deletedAt ?? undefined,
    isBot: user.isBot ?? false,
    joinDate,
    onboarded: true,
    profile: {
      id: user.id,
      timezone: null,
      description: `I am ${user.username}`,
      locale: 'en-US',
      social: {
        discordUsername: `${username}#1234`,
        linkedinURL: `https://www.linkedin.com/in/${username}`,
        twitterURL: `https://x.com/${username}`,
        githubURL: `https://github.com/${username}`
      } as Social
    },
    properties: [],
    searchValue: username,
    roles: []
  };
}
