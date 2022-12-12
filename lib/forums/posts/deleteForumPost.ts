import { prisma } from 'db';

export async function deleteForumPost(postId: string) {
  return prisma.page.delete({
    where: {
      id: postId
    }
  });
}
