import type { PostCategory, Space } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';

import type { CreatePostCategoryInput } from '../createPostCategory';
import type { PostCategoryUpdate } from '../updatePostCategory';
import { updatePostCategory } from '../updatePostCategory';

let space: Space;

beforeAll(async () => {
  space = (await generateUserAndSpaceWithApiToken()).space;
});
describe('updatePostCategory', () => {
  it('should only update the post category name and description', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category',
      spaceId: space.id
    };

    const postCategory = await generatePostCategory(createInput);

    // Generate a second space to try to move this post category to, and a manual path
    const { space: secondSpace } = await generateUserAndSpaceWithApiToken();
    const update: Partial<PostCategory> = {
      name: 'Updated Category',
      spaceId: secondSpace.id,
      path: 'updated_category_manually_set_path',
      description: 'Updated category description'
    };

    const updatedPostCategory = await updatePostCategory(postCategory.id, update);

    expect(updatedPostCategory.id).toBe(postCategory.id);
    expect(updatedPostCategory.name).toBe(update.name);
    expect(updatedPostCategory.description).toBe(update.description);
    // Check invalid changes were dropped
    expect(updatedPostCategory.spaceId).toBe(postCategory.spaceId);
    expect(updatedPostCategory.path).not.toBe(update.path);
  });

  it('should refresh the post category path', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category Path',
      spaceId: space.id
    };

    const postCategory = await generatePostCategory(createInput);

    expect(postCategory.path).toBe('test_category_path');

    const update: PostCategoryUpdate = {
      name: 'Updated Category Path'
    };

    const updatedPostCategory = await updatePostCategory(postCategory.id, update);

    expect(updatedPostCategory.id).toBe(postCategory.id);
    expect(updatedPostCategory.name).toBe(update.name);
    expect(updatedPostCategory.path).toBe('updated_category_path');
  });

  it('should fail to update a post category name if one with the same name already exists in this space', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'First Category',
      spaceId: space.id
    };

    const secondCreateInput: CreatePostCategoryInput = {
      name: 'Second Category',
      spaceId: space.id
    };

    await generatePostCategory(createInput);
    const secondCategory = await generatePostCategory(secondCreateInput);

    const update: PostCategoryUpdate = {
      name: 'First Category'
    };

    await expect(updatePostCategory(secondCategory.id, update)).rejects.toThrowError();
  });
});
