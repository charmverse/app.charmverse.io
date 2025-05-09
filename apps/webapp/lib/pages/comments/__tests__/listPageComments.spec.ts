import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePageWithComment } from '@packages/testing/utils/pages';

import { listPageComments } from '../listPageComments';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('listPageComments', () => {
  it('should get all the comments of a page with votes information', async () => {
    const { comment, page } = await generatePageWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const comments = await listPageComments({
      pageId: page.id,
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
