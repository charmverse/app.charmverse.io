import type { PostCategory, Space } from '@prisma/client';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { CreatePostCategoryInput } from '../createPostCategory';
import { createPostCategory } from '../createPostCategory';

let space: Space;

beforeAll(async () => {
  space = (await generateUserAndSpaceWithApiToken()).space;
});
describe('createPostCategory', () => {
  it('should create a post category', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Test Category',
      spaceId: space.id,
      color: '#000000'
    };

    const postCategory = await createPostCategory(createInput);

    expect(postCategory).toMatchObject(expect.objectContaining<Partial<PostCategory>>(createInput));
  });

  it('should fail to create a post category if one with the same name already exists in this space', async () => {
    const createInput: CreatePostCategoryInput = {
      name: 'Duplicate Category',
      spaceId: space.id,
      color: '#000000'
    };

    await createPostCategory(createInput);

    await expect(createPostCategory(createInput)).rejects.toThrowError();
  });
});
