import { prisma } from '@charmverse/core';
import type { PostCategoryPermissionLevel, Space, User } from '@prisma/client';
import { PostCategoryOperation } from '@prisma/client';
import { v4 } from 'uuid';

import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import { postCategoryOperations } from '../interfaces';
import { postCategoryPermissionsMapping } from '../mapping';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

describe('computePostCategoryPermissions', () => {
  it('should ignore space permissions if the user has applicable role permissions', async () => {
    // Perform the test with a page that has user / role / space / permissions ----------------------------
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    const userWithRole = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [userWithRole.id]
    });

    await Promise.all([
      upsertPostCategoryPermission({
        postCategoryId: postCategory.id,
        permissionLevel: 'full_access',
        assignee: {
          group: 'space',
          id: space.id
        }
      }),
      upsertPostCategoryPermission({
        postCategoryId: postCategory.id,
        permissionLevel: 'view',
        assignee: {
          group: 'role',
          id: role.id
        }
      })
    ]);

    const userWithRolePermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: userWithRole.id
    });

    // Check that the level assigned to the role was used in the compute
    typedKeys(PostCategoryOperation).forEach((op) => {
      // View level access should provide no operations at all to the category
      expect(userWithRolePermissions[op]).toBe(false);
    });

    // Check that other space members not belonging to the role continue to receive the space level permissions
    const spaceMemberPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    typedKeys(PostCategoryOperation).forEach((op) => {
      if (postCategoryPermissionsMapping.full_access.includes(op)) {
        expect(spaceMemberPermissions[op]).toBe(true);
      } else {
        expect(spaceMemberPermissions[op]).toBe(false);
      }
    });
  });
  it('should return full permissions for a category admin', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });

    const assignedPermission: PostCategoryPermissionLevel = 'category_admin';

    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: assignedPermission,
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    postCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  /// In future, we will want to extend this test to ensure it doesn't override an individual permission assigned as category admin for a specific space. The implementation already takes care of this, but we should have a test to ensure it doesn't regress.
  it('should return at least moderator level permissions if user is a space wide forum moderator', async () => {
    const spaceWideForumModeratorUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceWideForumModeratorUser.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['moderateForums'],
      roleId: role.id
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });

    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceWideForumModeratorUser.id
    });

    postCategoryOperations.forEach((op) => {
      if (postCategoryPermissionsMapping.moderator.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });
  it('should only allow a moderator to create a post', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });

    const assignedPermission: PostCategoryPermissionLevel = 'moderator';

    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: assignedPermission,
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    postCategoryOperations.forEach((op) => {
      if (op === 'create_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should only allow a member-level user to create a post', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });

    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    postCategoryOperations.forEach((op) => {
      if (op === 'create_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should ignore permissions in the database for users who are not members of the space, and return empty post category permissions', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        space: { connect: { id: otherSpace.id } }
      }
    });

    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: otherSpaceAdminUser.id
    });
    postCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(false);
    });
  });

  it('should ignore permissions in the database for members of the public, and return empty post category permissions', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        space: { connect: { id: otherSpace.id } }
      }
    });

    const publicPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: undefined
    });
    postCategoryOperations.forEach((op) => {
      expect(publicPermissions[op]).toBe(false);
    });
  });

  it('should ignore permissions in the database for users who are only guest-level space members, and return empty post category permissions', async () => {
    const guestUser = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        space: { connect: { id: space.id } }
      }
    });

    const guestPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: guestUser.id
    });
    postCategoryOperations.forEach((op) => {
      expect(guestPermissions[op]).toBe(false);
    });
  });

  it('should throw an error if the post category does not exist or is invalid', async () => {
    await expect(
      computePostCategoryPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(PostCategoryNotFoundError);

    await expect(
      computePostCategoryPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computePostCategoryPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
