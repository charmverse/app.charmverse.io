import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostWithComment } from '@packages/testing/utils/forums';

import { updatePostComment } from '../updatePostComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('updatePostComment', () => {
  it('should update a post comment if the user is the creator', async () => {
    const { comment } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const updatedPostComment = await updatePostComment({
      contentText: 'New Content',
      content: {
        type: 'paragraph'
      },
      commentId: comment.id
    });

    expect(updatedPostComment).toMatchObject(
      expect.objectContaining({
        contentText: 'New Content',
        content: {
          type: 'paragraph'
        }
      })
    );
  });
});
