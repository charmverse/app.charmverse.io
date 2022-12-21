import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { generateForumPosts } from '../forums';

describe('generateForumPosts', () => {
  it('should generate an arbitrary number of posts in a given space, each with their own createdAt date', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken();

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 5
    });

    expect(posts).toHaveLength(5);

    posts.forEach((post) => {
      expect(posts.some((p) => p.id !== post.id && p.createdAt === post.createdAt)).toBe(false);
    });
  });
});
