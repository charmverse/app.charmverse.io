import { prisma } from '@charmverse/core';
import type { Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { deleteThread } from '../deleteThread';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generated.user;
  space = generated.space;
});

describe('deleteThread', () => {
  it('should delete the thread and return true', async () => {
    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    const deleteResult = await deleteThread(thread.id);

    expect(deleteResult).toBe(true);
  });

  it('should fail if the thread does not exist', async () => {
    try {
      await deleteThread(v4());
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
