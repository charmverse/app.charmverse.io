import type { PageComment, Space, User } from '@charmverse/core/prisma';
import type { CreateCommentInput } from '@packages/lib/comments';
import { createPage, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import { createPageComment } from '../createPageComment';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('createPageComment', () => {
  it('should create a page comment', async () => {
    const commentInput: CreateCommentInput = {
      content: {
        type: ''
      },
      contentText: '',
      parentId: v4()
    };

    const page = await createPage({
      spaceId: space.id,
      createdBy: user.id
    });

    const postComment = await createPageComment({
      ...commentInput,
      pageId: page.id,
      userId: user.id
    });

    expect(postComment).toMatchObject(
      expect.objectContaining<Partial<PageComment>>({
        ...commentInput,
        pageId: page.id
      })
    );
  });
});
