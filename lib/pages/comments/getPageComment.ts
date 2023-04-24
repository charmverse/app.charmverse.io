import { prisma } from '@charmverse/core';
import type { PageComment } from '@charmverse/core/dist/prisma';

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
