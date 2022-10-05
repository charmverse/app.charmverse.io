
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { toggleThreadStatus } from '../toggleThreadStatus';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('toggleThreadStatus', () => {

  it('should return thread with resolved: false when it is open', async () => {

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    const updated = await toggleThreadStatus({
      id: thread.id,
      status: 'open'
    });

    expect(updated.resolved).toBe(false);
  });

  it('should return thread with resolved: true when it is closed', async () => {

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    const updated = await toggleThreadStatus({
      id: thread.id,
      status: 'closed'
    });

    expect(updated.resolved).toBe(true);
  });

  it('should fail if the thread does not exist', async () => {

    try {
      await toggleThreadStatus({
        id: v4(),
        status: 'closed'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect((err as Error).name).toStrictEqual('NotFoundError');
    }

  });

  it('should fail if an invalid status is provided', async () => {

    const { thread } = await generateCommentWithThreadAndPage({
      commentContent: 'First',
      spaceId: space.id,
      userId: user.id
    });

    try {
      await toggleThreadStatus({
        id: thread.id,
        status: 'invalid status' as any
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

});

