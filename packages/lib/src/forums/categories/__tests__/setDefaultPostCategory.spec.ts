import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceByDomain } from '@packages/spaces/getSpaceByDomain';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';

import { setDefaultPostCategory } from '../setDefaultPostCategory';

describe('setDefaultPostCategory', () => {
  it('should set the default post category and return the updated space', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    expect(space.defaultPostCategoryId).toBeNull();

    const postCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Test Category 1'
    });

    const spaceAfterUpdate = await setDefaultPostCategory({
      spaceId: space.id,
      postCategoryId: postCategory.id
    });

    expect(spaceAfterUpdate.defaultPostCategoryId).toBe(postCategory.id);
    expect(spaceAfterUpdate.id).toBe(space.id);
  });

  it('the space should have its default category ID nulled out if its default category is deleted', async () => {
    const { space } = await generateUserAndSpaceWithApiToken();

    expect(space.defaultPostCategoryId).toBeNull();

    const postCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Test Category 1'
    });

    await setDefaultPostCategory({
      spaceId: space.id,
      postCategoryId: postCategory.id
    });

    await prisma.postCategory.delete({
      where: {
        id: postCategory.id
      }
    });

    const spaceAfterUpdate = (await getSpaceByDomain(space.domain)) as Space;

    expect(spaceAfterUpdate).toMatchObject(
      expect.objectContaining<Partial<Space>>({
        id: space.id,
        domain: space.domain,
        permissionConfigurationMode: space.permissionConfigurationMode,
        defaultPostCategoryId: null
      })
    );
  });
});
