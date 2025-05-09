import type { PostCategory, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import { exportSpacePostCategories } from '../exportSpacePostCategories';

describe('exportSpacePostCategories', () => {
  let space: Space;
  let user: User;

  let postCategory1: PostCategory;
  let postCategory2: PostCategory;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace());
    postCategory1 = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    postCategory2 = await testUtilsForum.generatePostCategory({ spaceId: space.id });
  });

  it('should successfully retrieve post categories for a given space', async () => {
    // Assuming there are already some post categories in the test database for this space
    const { postCategories } = await exportSpacePostCategories({ spaceIdOrDomain: space.id });

    expect(postCategories).toEqual(expect.arrayContaining<PostCategory>([postCategory1, postCategory2]));
  });

  it('should return an empty array when space has no post categories', async () => {
    // Creating a new space to ensure it has no post categories
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();

    const { postCategories } = await exportSpacePostCategories({ spaceIdOrDomain: newSpace.id });

    expect(postCategories).toBeDefined();
    expect(Array.isArray(postCategories)).toBe(true);
    expect(postCategories).toHaveLength(0);
  });

  it('should throw an error for invalid space identifier', async () => {
    await expect(exportSpacePostCategories({ spaceIdOrDomain: 'non_existing_space_id' })).rejects.toThrowError();
  });

  it('should throw an error for missing or null space identifier', async () => {
    await expect(exportSpacePostCategories({ spaceIdOrDomain: '' })).rejects.toThrowError();

    await expect(exportSpacePostCategories({ spaceIdOrDomain: null as unknown as string })).rejects.toThrowError();
  });
});
