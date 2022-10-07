
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateCommentWithThreadAndPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { deleteComment } from '../deleteComment';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('deleteComment', () => {

  it('should delete a comment and return true', async () => {

    const { comment } = await generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: space.id,
      userId: user.id
    });

    const deleteResult = await deleteComment(comment.id);

    expect(deleteResult).toBe(true);
  });

  it('should fail if the comment to delete does not exist', async () => {
    try {
      await deleteComment(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

});

