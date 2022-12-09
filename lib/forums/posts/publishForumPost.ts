import { prisma } from 'db';

export async function publishForumPost(postId: string) {
  return prisma.post.update({
    where: {
      id: postId
    },
    data: {
      status: 'published'
    },
    include: {
      page: true
    }
  });
}
