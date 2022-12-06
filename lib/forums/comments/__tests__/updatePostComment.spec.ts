import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { UnauthorisedActionError } from 'lib/utilities/errors';
import { generatePostComment, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { deletePostComment } from '../deletePostComment';
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
      commentId: comment.id,
      userId: user.id
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

  it('should throw error when updating a post comment if the user is not the creator', async () => {
    const { comment } = await generatePostComment({
      userId: user.id,
      spaceId: space.id
    });

    await expect(async () => {
      await updatePostComment({
        contentText: 'New Content',
        content: {
          type: 'paragraph'
        },
        commentId: comment.id,
        userId: v4()
      });
    }).rejects.toBeInstanceOf(UnauthorisedActionError);
  });
});
