import type { PostCategory, Space } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import type { CreatePostCategoryInput } from '../createPostCategory';
import { createPostCategory } from '../createPostCategory';

let space: Space;

beforeAll(async () => {
  space = (await generateUserAndSpaceWithApiToken()).space;
});
describe('createPostCategory', () => {
  it('should create a post category with an encoded path', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category',
      spaceId: space.id
    };

    const postCategory = await createPostCategory(createInput);

    expect(postCategory).toMatchObject(
      expect.objectContaining<Partial<PostCategory>>({
        ...createInput,
        path: 'test_category'
      })
    );
  });

  it('should fail to create a post category if one with the same name already exists in this space', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Duplicate Category',
      spaceId: space.id
    };

    await createPostCategory(createInput);

    await expect(createPostCategory(createInput)).rejects.toThrowError();
  });
});
