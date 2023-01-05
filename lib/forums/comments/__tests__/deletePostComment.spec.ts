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
  it('should mark the comment as deleted and remove its content', async () => {
    const { comment } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const afterDelete = await deletePostComment({
      commentId: comment.id
    });

    expect(afterDelete.deletedAt).toBeInstanceOf(Date);
    expect(afterDelete.contentText).toBe('');
    expect(afterDelete.content).toStrictEqual({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
  });
});
