import type { PageComment } from '@prisma/client';

import { prisma } from 'db';
import { PageCommentNotFoundError } from 'lib/pages/comments/errors';

export async function getPageComment(commentId: string): Promise<PageComment> {
  const comment = await prisma.pageComment.findUnique({
    where: {
      id: commentId
    }
  });

  if (!comment) {
    throw new PageCommentNotFoundError(commentId);
  }

  return comment;
}
