
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addComment } from '../addComment';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('addComment', () => {

  it('should return the created comment along with the user', async () => {

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    const newCommentMessage = 'second';

    const newComment = await addComment({
      content: newCommentMessage,
      threadId: thread.id,
      userId: user.id
    });

    expect(newComment.content).toBe(newCommentMessage);

    expect(newComment.user).toBeDefined();
    expect(newComment.user.id).toBe(user.id);
  });

  it('should fail if the comment content is empty', async () => {

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    try {
      await addComment({
        content: null,
        threadId: thread.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail if the thread does not exist', async () => {

    try {
      await addComment({
        content: 'New content',
        threadId: v4(),
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

  it('should fail if the page does not exist', async () => {
    const { thread, page } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    await prisma.page.delete({
      where: {
        id: page.id
      }
    });

    try {
      await addComment({
        content: 'Some content',
        threadId: thread.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }

  });

});

