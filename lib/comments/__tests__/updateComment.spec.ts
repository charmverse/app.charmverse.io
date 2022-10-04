
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { updateComment } from '../updateComment';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('updateComment', () => {

  it('should return the updated comment along with the user', async () => {

    const { comment } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    const newCommentMessage = 'New content';

    const updated = await updateComment({
      id: comment.id,
      content: newCommentMessage
    });

    expect(updated.content).toBe(newCommentMessage);

    expect(updated.user).toBeDefined();
    expect(updated.user.id).toBe(user.id);
  });

  it('should fail if the comment does not exist', async () => {

    try {
      await updateComment({
        id: v4(),
        content: 'New content'
      });
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the update content is empty', async () => {
    const { comment } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    try {
      await updateComment({
        id: comment.id,
        content: null as any
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

});

