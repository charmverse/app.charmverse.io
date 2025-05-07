import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostWithComment } from '@packages/testing/utils/forums';

import { listPostComments } from '../listPostComments';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('listPostComments', () => {
  it('should get all the comments of a post with votes information', async () => {
    const { comment, post } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const comments = await listPostComments({
      postId: post.id,
      userId: user.id
    });

    expect(comments).toMatchObject([
      expect.objectContaining({
        id: comment.id,
        upvotes: 0,
        downvotes: 0,
        upvoted: null
      })
    ]);
  });
});
