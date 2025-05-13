import type { PageComment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { PageCommentNotFoundError } from './errors';

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
