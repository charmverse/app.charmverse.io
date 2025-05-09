import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePageWithComment } from '@packages/testing/utils/pages';

import { updatePageComment } from '../updatePageComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('updatePageComment', () => {
  it('should update page comment if the user is the creator', async () => {
    const { comment } = await generatePageWithComment({
      userId: user.id,
      spaceId: space.id
    });

    const updatedPageComment = await updatePageComment({
      contentText: 'New Content',
      content: {
        type: 'paragraph'
      },
      commentId: comment.id
    });

    expect(updatedPageComment).toMatchObject(
      expect.objectContaining({
        contentText: 'New Content',
        content: {
          type: 'paragraph'
        }
      })
    );
  });
});
