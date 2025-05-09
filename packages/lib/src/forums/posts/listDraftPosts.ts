import { prisma } from '@charmverse/core/prisma-client';

export interface ListDraftPostsRequest {
  spaceId: string;
  userId: string;
}

export async function listDraftPosts({ spaceId, userId }: { spaceId: string; userId: string }) {
  const posts = await prisma.post.findMany({
    where: {
      spaceId,
      createdBy: userId,
      deletedAt: null,
      isDraft: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return posts;
}
