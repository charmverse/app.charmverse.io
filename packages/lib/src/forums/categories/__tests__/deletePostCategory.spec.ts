import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import { InvalidInputError } from '@packages/utils/errors';
import { createForumPost } from '@packages/lib/forums/posts/createForumPost';

import { deletePostCategory } from '../deletePostCategory';
import { PostCategoryNotDeleteableError } from '../errors';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});

describe('deletePostCategory', () => {
  it('should delete a post category', async () => {
    const category = await generatePostCategory({
      spaceId: space.id,
      name: 'Test Category'
    });

    await deletePostCategory(category.id);

    const categoryAfterDelete = await prisma.postCategory.findUnique({
      where: {
        id: category.id
      }
    });

    expect(categoryAfterDelete).toBeNull();
  });

  it('should fail to delete a category if category id is undefined', async () => {
    await expect(deletePostCategory(undefined as any)).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail to delete a category if it has a post', async () => {
    const category = await generatePostCategory({
      spaceId: space.id,
      name: 'Test Category 2'
    });

    await createForumPost({
      content: null,
      spaceId: space.id,
      categoryId: category.id,
      title: 'Test Post',
      contentText: '',
      createdBy: user.id,
      isDraft: false
    });

    await expect(deletePostCategory(category.id)).rejects.toBeInstanceOf(PostCategoryNotDeleteableError);
  });
});
