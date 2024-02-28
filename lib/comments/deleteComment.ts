import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError } from 'lib/utils/errors';

export async function deleteComment(commentId: string): Promise<true> {
  try {
    await prisma.comment.delete({
      where: {
        id: commentId
      }
    });

    return true;
  } catch (err) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found.`);
  }
}
