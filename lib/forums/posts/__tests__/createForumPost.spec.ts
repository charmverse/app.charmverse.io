import type { Post, Space, User } from '@prisma/client';

import { InsecureOperationError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { createForumPost } from '../createForumPost';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});
describe('createForumPost', () => {
  it('should create a post linked to a specific category', async () => {
    const category = await generatePostCategory({
      spaceId: space.id
    });
    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category.id,
      isDraft: false
    });

    expect(createdPage).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        title: 'Test',
        locked: false,
        pinned: false
      })
    );
  });

  it('should fail to create the post if the category is in a different space', async () => {
    const { space: secondSpace } = await generateUserAndSpaceWithApiToken();

    const otherSpaceCategory = await generatePostCategory({ spaceId: secondSpace.id });

    await expect(
      createForumPost({
        content: {},
        contentText: '',
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test',
        categoryId: otherSpaceCategory.id,
        isDraft: false
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
