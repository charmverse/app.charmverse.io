import { prisma } from 'db';

export async function deleteForumPost(pageId: string) {
  return prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      deletedAt: new Date()
    }
  });
}
