import type { Social } from 'components/u/interfaces';
import type { Member } from 'lib/members/interfaces';

import { createMockUser } from './user';

export function createMockSpaceMember(user = createMockUser()): Member {
  const username = user.username.toLocaleLowerCase().replace(' ', '_');
  return {
    ...user,
    avatarTokenId: user.avatarTokenId ?? undefined,
    avatar: user.avatar ?? undefined,
    deletedAt: user.deletedAt ?? undefined,
    isBot: user.isBot ?? false,
    joinDate: new Date().toISOString(),
    onboarded: true,
    profile: {
      id: user.id,
      timezone: 'America/New_York',
      description: `I am ${user.username}`,
      locale: 'en-US',
      social: {
        discordUsername: `${username}#1234`,
        linkedinURL: `https://www.linkedin.com/in/${username}`,
        twitterURL: `https://twitter.com/${username}`,
        githubURL: `https://github.com/${username}`
      } as Social
    },
    properties: [],
    searchValue: username,
    roles: []
  };
}
