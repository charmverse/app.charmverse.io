
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createThread } from '../createThread';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('createThread', () => {

  it('should create a thread and return it with comments as well as the page space ID, and the user for each comment', async () => {

    const firstComment = 'First';

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await createThread({
      comment: firstComment,
      pageId: page.id,
      userId: user.id,
      context: 'context'
    });

    expect(thread.comments).toBeDefined();
    expect(thread.comments[0].content).toBe(firstComment);

    expect(thread.comments[0].user).toBeDefined();
    expect(thread.comments[0].user.id).toBe(user.id);

    expect(thread.spaceId).toBe(page.spaceId);
  });

  it('should fail if the page does not exist', async () => {

    try {
      await createThread({
        comment: 'Some content',
        pageId: v4(),
        userId: user.id,
        context: 'context'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the comment is empty', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    try {
      await createThread({
        comment: null as any,
        pageId: page.id,
        userId: user.id,
        context: 'context'
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the context is empty', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    try {
      await createThread({
        comment: 'Comment',
        pageId: page.id,
        userId: user.id,
        context: null as any
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

});

