import type { PageComment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function deletePageComment({
  commentId,
  userId
}: {
  commentId: string;
  userId: string;
}): Promise<PageComment> {
  const postComment = await prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      contentText: ''
    },
    include: {
      page: {
        select: {
          spaceId: true,
          id: true
        }
      }
    }
  });

  return postComment;
}
