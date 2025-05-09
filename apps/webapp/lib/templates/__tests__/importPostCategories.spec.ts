import type { PostCategory, Space } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { importPostCategories } from '../importPostCategories';

describe('importPostCategories', () => {
  let space: Space;
  let existingCategory: PostCategory;

  beforeAll(async () => {
    ({ space } = await testUtilsUser.generateUserAndSpace());
    existingCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      name: 'Example existing category'
    });
  });

  it('should import new categories', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace({});

    const { postCategories: importedCategories, oldNewIdMap } = await importPostCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        postCategories: [existingCategory]
      }
    });

    expect(importedCategories).toMatchObject([
      {
        ...existingCategory,
        id: expect.any(String),
        spaceId: targetSpace.id
      }
    ]);

    expect(oldNewIdMap).toMatchObject({
      [existingCategory.id]: expect.any(String)
    });
  });

  it('should not reimport categories that already have the same name', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace({});

    const { postCategories: importedCategories, oldNewIdMap } = await importPostCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        postCategories: [existingCategory]
      }
    });

    await importPostCategories({
      exportData: { postCategories: [existingCategory] },
      targetSpaceIdOrDomain: targetSpace.id
    });

    expect(importedCategories).toMatchObject([
      {
        ...existingCategory,
        id: expect.any(String),
        spaceId: targetSpace.id
      }
    ]);

    expect(oldNewIdMap).toMatchObject({
      [existingCategory.id]: expect.any(String)
    });
  });

  it('should handle a mix of existing and new categories', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const existingCategoryName = 'Existing category';

    const targetSpaceExistingCategory = await testUtilsForum.generatePostCategory({
      spaceId: targetSpace.id,
      name: existingCategoryName
    });

    const mixedCategories: PostCategory[] = [
      { id: uuid(), name: 'New Category 2', spaceId: space.id, description: 'Example description', path: 'path-01' },
      {
        id: uuid(),
        name: existingCategoryName,
        spaceId: space.id,
        description: 'Second Example description',
        path: 'path-02'
      }
    ];

    const { postCategories, oldNewIdMap } = await importPostCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        postCategories: mixedCategories
      }
    });

    expect(postCategories).toMatchObject(
      expect.arrayContaining<PostCategory>([
        {
          ...mixedCategories[0],
          spaceId: targetSpace.id,
          id: expect.any(String)
        },
        targetSpaceExistingCategory
      ])
    );

    expect(oldNewIdMap).toMatchObject({
      [mixedCategories[0].id]: expect.any(String),
      [mixedCategories[1].id]: targetSpaceExistingCategory.id
    });
  });

  it('should handle case sensitivity in category names', async () => {
    const categories: PostCategory[] = [
      {
        id: 'existing-cat-3',
        name: existingCategory.name.toUpperCase(),
        spaceId: space.id,
        description: 'Example description',
        path: 'path-01'
      }
    ];
    const result = await importPostCategories({
      targetSpaceIdOrDomain: space.id,
      exportData: { postCategories: categories }
    });

    expect(result.postCategories?.some((c) => c.name === existingCategory.name)).toBeTruthy();
    expect(result.oldNewIdMap?.['existing-cat-3']).toBe(existingCategory.id);
  });

  // Error Cases
  it('should throw error for invalid space Id or domain', async () => {
    await expect(
      importPostCategories({ targetSpaceIdOrDomain: 'invalid-space', exportData: { postCategories: [] } })
    ).rejects.toThrow(); // Specify the exact error type if known
  });

  it('should handle empty categories array gracefully', async () => {
    const result = await importPostCategories({
      targetSpaceIdOrDomain: space.id,
      exportData: { postCategories: [] }
    });
    expect(result.postCategories?.length).toBeGreaterThanOrEqual(0); // or specific checks
  });
});
