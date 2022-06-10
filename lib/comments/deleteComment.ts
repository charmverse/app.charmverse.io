import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

export async function deleteComment (commentId: string): Promise<true> {
  try {
    await prisma.comment.delete({
      where: {
        id: commentId
      }
    });

    return true;
  }
  catch (err) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found.`);
  }

}
