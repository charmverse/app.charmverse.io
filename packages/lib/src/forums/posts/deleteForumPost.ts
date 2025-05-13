import { prisma } from '@charmverse/core/prisma-client';

export async function deleteForumPost(pageId: string) {
  return prisma.post.update({
    where: {
      id: pageId
    },
    data: {
      deletedAt: new Date()
    }
  });
}
