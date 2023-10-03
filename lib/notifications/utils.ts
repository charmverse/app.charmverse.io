import type { GetNotificationsResponse } from 'pages/api/notifications/list';

export function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

export const notificationMetadataIncludeStatement = {
  space: {
    select: {
      id: true,
      name: true,
      domain: true
    }
  },
  author: {
    select: {
      id: true,
      username: true,
      path: true,
      avatar: true,
      avatarTokenId: true,
      avatarContract: true,
      avatarChain: true,
      deletedAt: true
    }
  }
} as const;

export const userNotifications: GetNotificationsResponse = {
  discussions: { marked: [], unmarked: [] },
  proposals: { marked: [], unmarked: [] },
  votes: { marked: [], unmarked: [] },
  bounties: { marked: [], unmarked: [] },
  forum: { marked: [], unmarked: [] }
};
