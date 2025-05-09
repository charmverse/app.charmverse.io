import type { Post, Space, User } from '@charmverse/core/prisma';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { v4 } from 'uuid';

import { canEditPost } from '../canEditPost';
import { PostNotFoundError } from '../errors';

let space: Space;
let user: User;
let post: Post;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
  post = await generateForumPost({
    spaceId: space.id,
    userId: user.id
  });
});

describe('canEditPost', () => {
  it('should return true if the user is the post author', async () => {
    await expect(canEditPost({ postId: post.id, userId: user.id })).resolves.toBe(true);
  });

  it('should return true if the user is an admin of the post space', async () => {
    const adminUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: true
    });
    await expect(canEditPost({ postId: post.id, userId: adminUser.id })).resolves.toBe(true);
  });
  it('should return false if the user is not the post author', async () => {
    const notAuthor = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    await expect(canEditPost({ postId: post.id, userId: notAuthor.id })).resolves.toBe(false);
  });

  it('should throw an error if the post does not exist', async () => {
    await expect(canEditPost({ postId: v4(), userId: user.id })).rejects.toBeInstanceOf(PostNotFoundError);
  });
});
