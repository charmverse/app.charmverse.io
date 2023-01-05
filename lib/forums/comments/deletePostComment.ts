import type { PostComment } from '@prisma/client';

import { prisma } from 'db';

export async function deletePostComment({ commentId }: { commentId: string }): Promise<PostComment> {
  return prisma.postComment.update({
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
