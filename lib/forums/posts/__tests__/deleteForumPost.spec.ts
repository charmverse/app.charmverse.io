import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateForumPost } from 'testing/utils/forums';

import { deleteForumPost } from '../deleteForumPost';

describe('deleteForumPost', () => {
  // Implicitly tests Prisma cascading behaviour, where deleting a post should auto-delete the corresponding page
  it('should delete a post and the corresponding page', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const postPage = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });

    await deleteForumPost(postPage.post.id);

    const [post, page] = await Promise.all([
      prisma.post.findUnique({ where: { id: postPage.post.id } }),
      prisma.page.findUnique({ where: { id: postPage.id } })
    ]);

    expect(post).toBeNull();
    expect(page).toBeNull();
  });
});
