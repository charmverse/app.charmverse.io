import type { PostComment } from '@prisma/client';

import { prisma } from 'db';

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
