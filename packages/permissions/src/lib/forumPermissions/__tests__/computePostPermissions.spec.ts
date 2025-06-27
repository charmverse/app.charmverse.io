import type { Space, User } from '@charmverse/core/prisma';
import { PostOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError, PostNotFoundError } from '@packages/core/errors';
import { objectUtils } from '@packages/core/utilities';
import { v4 } from 'uuid';

import { addSpaceOperations } from 'lib/spacePermissions/addSpaceOperations';

import { baseComputePostPermissions, computePostPermissions } from '../computePostPermissions';
import { postOperations, postOperationsWithoutEdit, postPermissionsMapping } from '../mapping';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;
beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

describe('computePostPermissions - base', () => {
  // This test exists so we can apply a certain permission level to the space, but make it higher or lower for a user
  it('should ignore space permissions if the user has applicable role permissions', async () => {
    // Perform the test with a page that has user / role / space / permissions ----------------------------
    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const userWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
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

    const userWithRolePermissions = await computePostPermissions({
      resourceId: post.id,
      userId: userWithRole.id
    });

    // Check that the level assigned to the role was used in the compute
    objectUtils.typedKeys(PostOperation).forEach((op) => {
      if (postPermissionsMapping.view.includes(op)) {
        expect(userWithRolePermissions[op]).toBe(true);
      } else {
        expect(userWithRolePermissions[op]).toBe(false);
      }
    });

    // Check that other space members not belonging to the role continue to receive the space level permissions
    const spaceMemberPermissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    objectUtils.typedKeys(PostOperation).forEach((op) => {
      if (postPermissionsMapping.full_access.includes(op)) {
        expect(spaceMemberPermissions[op]).toBe(true);
      } else {
        expect(spaceMemberPermissions[op]).toBe(false);
      }
    });
  });
  it('should always allow the author to view, edit and delete the post', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: authorUser.id
    });

    postOperations.forEach((op) => {
      if (op === 'edit_post' || op === 'delete_post' || op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  // We'll often assign member-level access at space level
  it('should take into account space-level permissions', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    const memberPermissions = postPermissionsMapping.full_access;

    postOperations.forEach((op) => {
      if (memberPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should take into account role-level permissions', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    const memberPermissions = postPermissionsMapping.full_access;

    postOperations.forEach((op) => {
      if (memberPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should apply public permissions to space members', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'view',
        postCategory: { connect: { id: postCategory.id } },
        public: true
      }
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    const guestOperations = postPermissionsMapping.view;

    postOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should only apply public permissions to space members with a guest level membership', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await Promise.all([
      upsertPostCategoryPermission({
        assignee: { group: 'space', id: space.id },
        permissionLevel: 'full_access',
        postCategoryId: postCategory.id
      }),
      upsertPostCategoryPermission({
        assignee: { group: 'public' },
        permissionLevel: 'view',
        postCategoryId: postCategory.id
      })
    ]);

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: guestUser.id
    });

    const guestOperations = postPermissionsMapping.view;

    postOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should ignore permissions in the database for users who are not members of the space as well as members of the public, and return only post permissions assigned to the public level', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        space: { connect: { id: otherSpace.id } }
      }
    });
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'view',
        postCategory: { connect: { id: postCategory.id } },
        public: true
      }
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: otherSpaceAdminUser.id
    });

    const guestOperations = postPermissionsMapping.view;

    postOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });

    // Same as above, without a requesting user
    const publicPermissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: undefined
    });
    postOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(publicPermissions[op]).toBe(true);
      } else {
        expect(publicPermissions[op]).toBe(false);
      }
    });
  });

  it('should throw an error if the post does not exist or postId is invalid', async () => {
    await expect(
      baseComputePostPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(PostNotFoundError);

    await expect(
      baseComputePostPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      baseComputePostPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});

describe('computePostPermissions - with editable by author only permission filtering policy', () => {
  it('should always return full permissions for a space administrator, except editing a post they did not create', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
    expect(permissions.edit_post).toBe(false);
  });

  it('should return full permissions for a category admin, except editing a post they did not create', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'category_admin',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.edit_post).toBe(false);
  });

  it('should return full permissions for a moderator, except editing a post they did not create', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    await prisma.postCategoryPermission.create({
      data: {
        permissionLevel: 'moderator',
        postCategory: { connect: { id: postCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.edit_post).toBe(false);
  });

  it('should always return full permissions for a user with space-wide forum moderator permission, except editing a post they did not create', async () => {
    const spaceWideForumModeratorUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceWideForumModeratorUser.id]
    });

    await addSpaceOperations({
      resourceId: space.id,
      operations: ['moderateForums'],
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: spaceWideForumModeratorUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
    expect(permissions.edit_post).toBe(false);
  });

  it('should always return at most the view permissions if user is public member', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await upsertPostCategoryPermission({
      assignee: {
        group: 'public'
      },
      permissionLevel: 'view',
      postCategoryId: postCategory.id
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions.edit_post).toBe(false);
      }
    });
  });

  it('should always return at most the view permissions if user is a guest-level member in the space', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    // This permission should not be used because the user is a guest
    await upsertPostCategoryPermission({
      assignee: {
        group: 'space',
        id: space.id
      },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    await upsertPostCategoryPermission({
      assignee: {
        group: 'public'
      },
      permissionLevel: 'view',
      postCategoryId: postCategory.id
    });

    const permissions = await baseComputePostPermissions({
      resourceId: post.id,
      userId: guestUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions.edit_post).toBe(false);
      }
    });
  });
});

describe('computePostPermissions - with proposal permission filtering policy', () => {
  it('should return unmodified permissions for admins', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: authorUser.id });
    await prisma.post.update({
      where: {
        id: post.id
      },
      data: {
        proposalId: proposal.id
      }
    });

    const permissionsAfterConversionToProposal = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });

    expect(permissionsAfterConversionToProposal).toMatchObject(permissions);
  });

  it('should return delete_post and view_post permissions of a proposal converted post for author', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: authorUser.id });
    await prisma.post.update({
      where: {
        id: post.id
      },
      data: {
        proposalId: proposal.id
      }
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: authorUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'delete_post' || op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should return only view_post permissions of a proposal converted post for a regular user', async () => {
    const postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: authorUser.id });
    await prisma.post.update({
      where: {
        id: post.id
      },
      data: {
        proposalId: proposal.id
      }
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });
});
