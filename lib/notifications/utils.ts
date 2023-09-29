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

export const upgradedNotificationUserIds = process.env.USER_IDS
  ? process.env.USER_IDS.split(',')
  : [
      'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835', // chris in prod
      '4e1d4522-6437-4393-8ed1-9c56e53235f4', // matt in prod
      '5906c806-9497-43c7-9ffc-2eecd3c3a3ec', // safwan in prod
      'fb1013cc-d08a-471e-9835-6c86b760aff1', // safwan in staging
      'd7f22868-de36-4539-b820-f3c6a347ff61' // matt in staging
    ];
