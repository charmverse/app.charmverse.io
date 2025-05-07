import type { PostComment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { PostCommentNotFoundError } from './errors';

export async function getPostComment(commentId: string): Promise<PostComment> {
  const postComment = await prisma.postComment.findUnique({
    where: {
      id: commentId
    }
  });

  if (!postComment) {
    throw new PostCommentNotFoundError(commentId);
  }

  return postComment;
}
