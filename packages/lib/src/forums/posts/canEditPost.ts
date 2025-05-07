import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';

import { PostNotFoundError } from './errors';

type PostAccessRequest = {
  postId: string;
  userId: string;
};

export async function canEditPost({ postId, userId }: PostAccessRequest): Promise<boolean> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      spaceId: true,
      createdBy: true
    }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  // Only allow post author or space admin to update post
  if (userId !== post.createdBy) {
    const { error } = await hasAccessToSpace({ spaceId: post.spaceId, userId, adminOnly: true });

    if (error) {
      return false;
    }
  }

  return true;
}
