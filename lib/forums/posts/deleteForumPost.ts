import { prisma } from 'db';

export async function deleteForumPost(postId: string) {
  await prisma.post.delete({
    where: {
      id: postId
    }
  });
}
