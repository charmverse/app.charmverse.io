import type { Space, User } from '@prisma/client';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostComment } from 'testing/utils/forums';

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
    const { comment } = await generatePostComment({
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
