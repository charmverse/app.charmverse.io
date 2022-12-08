import { prisma } from 'db';
import { upsertPermission } from 'lib/permissions/pages';

export async function publishForumPost(postId: string) {
  const updatedPost = await prisma.post.update({
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

  if (updatedPost.page) {
    await upsertPermission(
      updatedPost.id,
      {
        permissionLevel: 'view',
        spaceId: updatedPost.page.spaceId
      },
      undefined
    );
  }

  return updatedPost;
}
