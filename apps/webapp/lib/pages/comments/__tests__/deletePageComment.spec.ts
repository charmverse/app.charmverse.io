import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePageWithComment } from '@packages/testing/utils/pages';

import { deletePageComment } from '../deletePageComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('deletePageComment', () => {
  it('should mark the page comment as deleted, remove its content and save who deleted the comment', async () => {
    const { comment } = await generatePageWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const afterDelete = await deletePageComment({
      commentId: comment.id,
      userId: user.id
    });

    expect(afterDelete.deletedAt).toBeInstanceOf(Date);
    expect(afterDelete.contentText).toBe('');
    expect(afterDelete.content).toStrictEqual({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
    expect(afterDelete.deletedBy).toBe(user.id);
  });
});
