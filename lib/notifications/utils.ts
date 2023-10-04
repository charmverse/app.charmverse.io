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
      'f5454564-7005-4131-85e0-794bbeaa0225',
      'fcf8a850-c196-4b4e-81ff-16e2bd9aea85',
      '29f84e2f-eda3-45b1-a99c-77cadb896d89',
      'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835', // chris in prod
      '5906c806-9497-43c7-9ffc-2eecd3c3a3ec', // safwan in prod
      '4e1d4522-6437-4393-8ed1-9c56e53235f4', // matt in prod
      'ed3ad050-49a2-4892-8efb-5ef86065fb9a', // chris in staging
      'fb1013cc-d08a-471e-9835-6c86b760aff1', // safwan in staging
      'd7f22868-de36-4539-b820-f3c6a347ff61' // matt in staging
    ];
