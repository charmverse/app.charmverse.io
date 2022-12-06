import type { PostCategory, Space } from '@prisma/client';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { CreatePostCategoryInput } from '../createPostCategory';
import { createPostCategory } from '../createPostCategory';
import type { PostCategoryUpdate } from '../updatePostCategory';
import { updatePostCategory } from '../updatePostCategory';

let space: Space;

beforeAll(async () => {
  space = (await generateUserAndSpaceWithApiToken()).space;
});
describe('updatePostCategory', () => {
  it('should update a post category', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category',
      spaceId: space.id,
      color: '#000000'
    };

    const postCategory = await createPostCategory(createInput);

    const update: PostCategoryUpdate = {
      name: 'Updated Category',
      color: '#FFFFFF'
    };

    const updatedPostCategory = await updatePostCategory(postCategory.id, update);

    expect(updatedPostCategory.id).toBe(postCategory.id);
    expect(updatedPostCategory.name).toBe(update.name);
    expect(updatedPostCategory.color).toBe(update.color);
  });

  it('should fail to update a post category name if one with the same name already exists in this space', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'First Category',
      spaceId: space.id,
      color: '#000000'
    };

    const secondCreateInput: CreatePostCategoryInput = {
      name: 'Second Category',
      spaceId: space.id,
      color: '#000000'
    };

    await createPostCategory(createInput);
    const secondCategory = await createPostCategory(secondCreateInput);

    const update: PostCategoryUpdate = {
      name: 'First Category'
    };

    await expect(updatePostCategory(secondCategory.id, update)).rejects.toThrowError();
  });
});
