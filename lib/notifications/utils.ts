// utils
export function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

export const notificationMetadataIncludeStatement = {
  space: {
    select: {
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
      avatarTokenId: true
    }
  }
} as const;
