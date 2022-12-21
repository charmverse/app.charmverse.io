import { prisma } from 'db';

export async function deleteForumPost(pageId: string) {
  const page = await prisma.page.delete({
    where: {
      id: pageId
    }
  });
  if (page.postId) {
    await prisma.post.delete({
      where: {
        id: page.postId
      }
    });
  }
}
