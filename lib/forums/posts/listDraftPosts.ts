import { prisma } from 'db';

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
    }
  });

  return posts;
}
