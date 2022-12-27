import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { UnauthorisedActionError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostWithComment } from 'testing/utils/forums';

import { deletePostComment } from '../deletePostComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('deletePostComment', () => {
  it('should delete a post comment if the user is the creator', async () => {
    const { comment } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    await expect(
      deletePostComment({
        commentId: comment.id,
        userId: user.id
      })
    ).resolves.not.toThrowError();
  });

  it('should throw error when deleting a post comment if the user is not the creator', async () => {
    const { comment } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    await expect(async () => {
      await deletePostComment({
        commentId: comment.id,
        userId: v4()
      });
    }).rejects.toBeInstanceOf(UnauthorisedActionError);
  });
});
