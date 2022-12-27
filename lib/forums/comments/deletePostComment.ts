import { prisma } from 'db';
import { UnauthorisedActionError } from 'lib/utilities/errors';

export async function deletePostComment({ commentId, userId }: { commentId: string; userId: string }) {
  const updatedComment = await prisma.pageComment.updateMany({
    where: {
      id: commentId,
      createdBy: userId,
      deletedAt: null
    },
    data: {
      deletedAt: new Date(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      contentText: ''
    }
  });

  if (updatedComment.count !== 1) {
    throw new UnauthorisedActionError();
  }
}
