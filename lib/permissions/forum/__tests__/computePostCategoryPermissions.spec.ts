import type { PostCategoryPermissionLevel, Space, User, SpaceRole } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
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

  it('should return the correct operations for a moderator', async () => {
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

    const assignedPermissions = postCategoryPermissionsMapping[assignedPermission];

    assignedPermissions.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    postCategoryOperations.forEach((op) => {
      if (!assignedPermissions.includes(op)) {
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
        permissionLevel: 'member',
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

  it('should always return full permissions for a space administrator', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: adminUser.id
    });

    postCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  it('should ignore permissions in the database for users who are not members of the space as well as members of the public, and return empty post category permissions', async () => {
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

    const publicPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: undefined
    });
    postCategoryOperations.forEach((op) => {
      expect(publicPermissions[op]).toBe(false);
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
