import { prisma } from 'db';

export async function deleteForumPost(postId: string) {
  return prisma.post.delete({
    where: {
      id: postId
    }
  });
}
