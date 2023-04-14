import { prisma } from '@charmverse/core';
import type { PostCategoryPermission } from '@prisma/client';
import { v4 } from 'uuid';

import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { assignDefaultPostCategoryPermissions } from '../assignDefaultPostCategoryPermission';

describe('assignDefaultPostCategoryPermission', () => {
  it('should create a space / full access permission by default', async () => {
    const { space } = await generateUserAndSpace({ isAdmin: false });

    const category = await generatePostCategory({ spaceId: space.id });

    await assignDefaultPostCategoryPermissions({ postCategoryId: category.id });

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
    await expect(assignDefaultPostCategoryPermissions({ postCategoryId: v4() })).rejects.toBeInstanceOf(
      PostCategoryNotFoundError
    );
  });
});
