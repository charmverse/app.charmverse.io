export function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

export const notificationMetadataSelectStatement = {
  seenAt: true,
  archivedAt: true,
  spaceId: true,
  createdAt: true,
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
