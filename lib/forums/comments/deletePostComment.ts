import { prisma } from 'db';
import { UnauthorisedActionError } from 'lib/utilities/errors';

export async function deletePostComment({ commentId, userId }: { commentId: string; userId: string }) {
  const deletedComment = await prisma.pageComment.deleteMany({
    where: {
      id: commentId,
      createdBy: userId
    }
  });

  if (deletedComment.count !== 1) {
    throw new UnauthorisedActionError();
  }
}
