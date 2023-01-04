import { prisma } from 'db';

export async function deletePostComment({ commentId, userId }: { commentId: string; userId: string }) {
  await prisma.postComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      contentText: ''
    }
  });
}
