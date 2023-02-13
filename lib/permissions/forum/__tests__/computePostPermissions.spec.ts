import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { convertPostToProposal } from 'lib/forums/posts/convertPostToProposal';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { computePostPermissions } from '../computePostPermissions';
import { postOperations, postOperationsWithoutEdit } from '../interfaces';
import { postPermissionsMapping } from '../mapping';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

describe('computePostPermissions - base', () => {
  it('should return full permissions for a category admin, except editing a post they did not create', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
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

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.edit_post).toBe(false);
  });

  it('should return full permissions for a moderator, except editing a post they did not create', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
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

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceMemberUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });

    expect(permissions.edit_post).toBe(false);
  });

  it('should always return full permissions for a space administrator, except editing a post they did not create', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
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

  it('should always return full permissions for a user with space-wide forum moderator permission, except editing a post they did not create', async () => {
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
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceWideForumModeratorUser.id
    });
    postOperationsWithoutEdit.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
    expect(permissions.edit_post).toBe(false);
  });

  it('should always allow the author to view, edit and delete the post', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });
    const permissions = await computePostPermissions({
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
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const permissions = await computePostPermissions({
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
    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await generateForumPost({
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

    const permissions = await computePostPermissions({
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

  it('should ignore permissions in the database for users who are not members of the space as well as members of the public, and return only post permissions assigned to the public level', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await generateForumPost({
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

    const permissions = await computePostPermissions({
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
    const publicPermissions = await computePostPermissions({
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
      computePostPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(PostNotFoundError);

    await expect(
      computePostPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computePostPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
describe('computePostPermissions - with proposal permission filtering policy', () => {
  it('should return delete_post and view_post permissions of a proposal converted post for admins', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await convertPostToProposal({
      postId: post.id,
      spaceId: space.id,
      title: post.title,
      userId: authorUser.id
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: adminUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'delete_post' || op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should return delete_post and view_post permissions of a proposal converted post for author', async () => {
    const postCategory = await generatePostCategory({ spaceId: space.id });
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await convertPostToProposal({
      postId: post.id,
      spaceId: space.id,
      title: post.title,
      userId: authorUser.id
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

  it('should return delete_post and view_post permissions of a proposal converted post for space-wide forum permission', async () => {
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
    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await convertPostToProposal({
      postId: post.id,
      spaceId: space.id,
      title: post.title,
      userId: authorUser.id
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: spaceWideForumModeratorUser.id
    });

    postOperationsWithoutEdit.forEach((op) => {
      if (op === 'delete_post' || op === 'view_post') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should return delete_post and view_post permissions of a proposal converted post for category level admin', async () => {
    const categoryLevelAdminUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [categoryLevelAdminUser.id]
    });

    const postCategory = await generatePostCategory({ spaceId: space.id });

    const post = await generateForumPost({
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

    await convertPostToProposal({
      postId: post.id,
      spaceId: space.id,
      title: post.title,
      userId: authorUser.id
    });

    const permissions = await computePostPermissions({
      resourceId: post.id,
      userId: categoryLevelAdminUser.id
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
    const postCategory = await generatePostCategory({ spaceId: space.id });

    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });

    const post = await generateForumPost({
      spaceId: space.id,
      categoryId: postCategory.id,
      userId: authorUser.id
    });

    await convertPostToProposal({
      postId: post.id,
      spaceId: space.id,
      title: post.title,
      userId: authorUser.id
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
