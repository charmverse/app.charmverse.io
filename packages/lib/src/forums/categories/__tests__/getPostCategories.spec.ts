import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import { getPostCategories } from '../getPostCategories';

describe('getPostCategories', () => {
  it('should return all post categories in a space', async () => {
    const space = (await generateUserAndSpaceWithApiToken()).space;

    const createInput: Prisma.PostCategoryCreateManyInput[] = [
      {
        name: 'Category 1',
        spaceId: space.id
      },
      {
        name: 'Category 2',
        spaceId: space.id
      },
      {
        name: 'Category 3',
        spaceId: space.id
      }
    ];

    await prisma.postCategory.createMany({
      data: createInput
    });

    const categories = await getPostCategories(space.id);

    expect(categories.length).toBe(3);

    expect(categories).toEqual(expect.arrayContaining(createInput.map((input) => expect.objectContaining(input))));
  });
});
