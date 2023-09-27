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
  user: {
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

export const upgradedNotificationUserIds = process.env.USER_IDS
  ? process.env.USER_IDS.split(',')
  : ['4e1d4522-6437-4393-8ed1-9c56e53235f4', '5906c806-9497-43c7-9ffc-2eecd3c3a3ec'];
