import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import { exportForumPosts } from '../exportForumPosts';

describe('exportForumPosts', () => {
  let user: User;
  let space: Space;
  let postCategory: PostCategory;
  let posts: Post[];

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    posts = await testUtilsForum.generateForumPosts({
      spaceId: space.id,
      count: 3,
      createdBy: user.id,
      categoryId: postCategory.id
    });
  });

  it('should export forum posts correctly', async () => {
    const result = await exportForumPosts({ spaceIdOrDomain: space.id });

    expect(result).toMatchObject({
      posts: expect.arrayContaining(posts),
      postCategories: [postCategory]
    });
  });

  it('should throw an error if space does not exist', async () => {
    await expect(exportForumPosts({ spaceIdOrDomain: 'non-existent-space' })).rejects.toThrow();
  });
});
