import type { PostCategoryPermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateRole, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import { MissingDataError } from '@packages/utils/errors';
import { v4 as uuid } from 'uuid';

import { AvailableSpacePermissions } from '../availableSpacePermissions';
import { saveRoleAndSpacePermissions } from '../saveRoleAndSpacePermissions';

describe('saveRoleAndSpacePermissions', () => {
  it('should replace the existing permissions assigned to a space or role for the SpacePermission, PostCategoryPermission entities without affecting public permissions', async () => {
    const { space, user } = await generateUserAndSpace({});
    const role = await generateRole({ spaceId: space.id, createdBy: user.id, assigneeUserIds: [user.id] });

    const postCategory = await generatePostCategory({
      spaceId: space.id
    });
    const secondPostCategory = await generatePostCategory({
      spaceId: space.id
    });

    const thirdPostCategory = await generatePostCategory({
      spaceId: space.id
    });

    const permissions = await prisma.$transaction([
      prisma.spacePermission.create({
        data: {
          forSpaceId: space.id,
          spaceId: space.id,
          operations: ['createPage']
        }
      }),
      prisma.postCategoryPermission.create({
        data: {
          postCategoryId: postCategory.id,
          permissionLevel: 'full_access',
          spaceId: space.id
        }
      }),
      prisma.postCategoryPermission.create({
        data: {
          postCategoryId: postCategory.id,
          permissionLevel: 'view',
          public: true
        }
      }),
      // We will try passing this existing permission in the following update. This checks for a bug where an error would be thrown, since the public permission was not deleted, but we tried to create a new one with the same ID
      prisma.postCategoryPermission.create({
        data: {
          postCategoryId: thirdPostCategory.id,
          permissionLevel: 'view',
          public: true
        }
      })
    ]);

    await saveRoleAndSpacePermissions(space.id, {
      space: [
        {
          operations: {
            ...new AvailableSpacePermissions().empty,
            createPage: true
          },
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      ],
      forumCategories: [
        {
          id: uuid(),
          permissionLevel: 'full_access',
          postCategoryId: postCategory.id,
          assignee: {
            group: 'role',
            id: role.id
          }
        },
        // No public permission for postCategory, and creating a new permission for secondPostCategory
        // We expect both these updates to be ignored
        {
          id: uuid(),
          permissionLevel: 'view',
          postCategoryId: secondPostCategory.id,
          assignee: {
            group: 'public'
          }
        },
        {
          id: uuid(),
          permissionLevel: 'view',
          postCategoryId: thirdPostCategory.id,
          assignee: {
            group: 'public'
          }
        }
      ]
    });

    const [spacePermissions, postCategoryPermissions, secondPostCategoryPermissions, thirdPostCategoryPermissions] =
      await Promise.all([
        prisma.spacePermission.findMany({
          where: {
            forSpaceId: space.id
          }
        }),
        prisma.postCategoryPermission.findMany({
          where: {
            postCategoryId: postCategory.id
          }
        }),
        prisma.postCategoryPermission.findMany({
          where: {
            postCategoryId: secondPostCategory.id
          }
        }),
        prisma.postCategoryPermission.findMany({
          where: {
            postCategoryId: thirdPostCategory.id
          }
        })
      ]);

    expect(spacePermissions).toHaveLength(1);
    // We expect the old space permission to have been dropped since it was not included in the new permission set
    expect(postCategoryPermissions).toHaveLength(2);
    expect(postCategoryPermissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining<Partial<PostCategoryPermission>>({
          roleId: role.id,
          permissionLevel: 'full_access'
        })
      ])
    );
    // Existing public permission should not have been affected
    expect(postCategoryPermissions).toContainEqual(
      expect.objectContaining<Partial<PostCategoryPermission>>({
        public: true,
        permissionLevel: 'view'
      })
    );
    // Attempt to add a new public permission should have been ignored
    expect(secondPostCategoryPermissions).toHaveLength(0);

    expect(thirdPostCategoryPermissions).toHaveLength(1);
    expect(thirdPostCategoryPermissions).toContainEqual(
      expect.objectContaining<Partial<PostCategoryPermission>>({
        public: true,
        permissionLevel: 'view'
      })
    );
  });

  it('should throw an error if no space permissions are provided for the default role of the space', async () => {
    const { space } = await generateUserAndSpace({});

    await expect(
      saveRoleAndSpacePermissions(space.id, {
        space: [],
        forumCategories: []
      })
    ).rejects.toBeInstanceOf(MissingDataError);
  });
});
