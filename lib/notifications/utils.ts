export type QueryCondition = { id?: string; userId?: string };
export function queryCondition({ id, userId }: QueryCondition) {
  if (id) {
    return { id };
  }

  if (userId) {
    return {
      notificationMetadata: {
        userId
      }
    };
  }

  throw new Error('id or userId must be defined to query notification');
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
  userId: true,
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
