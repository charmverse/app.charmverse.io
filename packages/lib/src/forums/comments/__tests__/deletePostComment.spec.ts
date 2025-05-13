import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostWithComment } from '@packages/testing/utils/forums';

import { deletePostComment } from '../deletePostComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('deletePostComment', () => {
  it('should mark the comment as deleted, remove its content and save who deleted the comment', async () => {
    const { comment } = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const afterDelete = await deletePostComment({
      commentId: comment.id,
      userId: user.id
    });

    expect(afterDelete.deletedAt).toBeInstanceOf(Date);
    expect(afterDelete.contentText).toBe('');
    expect(afterDelete.content).toStrictEqual({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
    expect(afterDelete.deletedBy).toBe(user.id);
  });
});
