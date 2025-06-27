import type { PostCategoryPermissionLevel, Space, User } from '@charmverse/core/prisma';
import { PostCategoryOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsForum, testUtilsMembers } from '@charmverse/core/test';
import { InvalidInputError, PostCategoryNotFoundError } from '@packages/core/errors';
import { objectUtils } from '@packages/core/utilities';
import { v4 } from 'uuid';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import { postCategoryPermissionsMapping, postCategoryOperations } from '../mapping';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

describe('computePostCategoryPermissions', () => {
  it('should ignore space permissions if the user has applicable role permissions', async () => {
    // Perform the test with a page that has user / role / space / permissions ----------------------------
    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const userWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const role = await testUtilsMembers.generateRole({
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
    objectUtils.typedKeys(PostCategoryOperation).forEach((op) => {
      // View level access should provide no operations at all to the category
      if (op === 'view_posts') {
        expect(userWithRolePermissions[op]).toBe(true);
      } else {
        expect(userWithRolePermissions[op]).toBe(false);
      }
    });

    // Check that other space members not belonging to the role continue to receive the space level permissions
    const spaceMemberPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    objectUtils.typedKeys(PostCategoryOperation).forEach((op) => {
      if (postCategoryPermissionsMapping.full_access.includes(op)) {
        expect(spaceMemberPermissions[op]).toBe(true);
      } else {
        expect(spaceMemberPermissions[op]).toBe(false);
      }
    });
  });
  it('should return full permissions for a category admin', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
    const spaceWideForumModeratorUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceWideForumModeratorUser.id]
    });

    await prisma.spacePermission.create({
      data: {
        forSpace: {
          connect: {
            id: space.id
          }
        },
        operations: ['moderateForums'],
        role: {
          connect: {
            id: role.id
          }
        }
      }
    });

    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
  it('should allow a moderator to create a post', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
      if (op === 'create_post' || op === 'view_posts' || op === 'comment_posts') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should allow a member-level user to create a post, view posts and comment on them', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
      if (op === 'create_post' || op === 'view_posts' || op === 'comment_posts') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should ignore permissions in the database for users who are not members of the space, and return empty post category permissions', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

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
