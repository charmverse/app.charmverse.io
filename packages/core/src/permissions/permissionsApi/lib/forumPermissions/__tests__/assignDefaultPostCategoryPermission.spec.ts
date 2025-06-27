import type { PostCategoryPermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsForum } from '@charmverse/core/test';
import { PostCategoryNotFoundError } from '@packages/core/errors';
import { v4 } from 'uuid';

import { assignDefaultPostCategoryPermissions } from '../assignDefaultPostCategoryPermission';

describe('assignDefaultPostCategoryPermission', () => {
  it('should create a space / full access permission by default', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    const category = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    await assignDefaultPostCategoryPermissions({ resourceId: category.id });

    const permissions = await prisma.postCategoryPermission.findMany({
      where: {
        postCategoryId: category.id
      }
    });

    expect(permissions.length).toBe(1);

    const permission = permissions[0];

    expect(permission).toMatchObject(
      expect.objectContaining<PostCategoryPermission>({
        id: expect.any(String),
        spaceId: space.id,
        roleId: null,
        public: null,
        postCategoryId: category.id,
        permissionLevel: 'full_access',
        categoryOperations: [],
        postOperations: []
      })
    );
  });

  it('should throw an error if the post category does not exist', async () => {
    await expect(assignDefaultPostCategoryPermissions({ resourceId: v4() })).rejects.toBeInstanceOf(
      PostCategoryNotFoundError
    );
  });
});
