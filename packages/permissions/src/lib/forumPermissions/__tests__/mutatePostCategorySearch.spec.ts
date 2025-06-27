import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsUser, testUtilsForum } from '@charmverse/core/test';

import { addSpaceOperations } from 'lib/spacePermissions/addSpaceOperations';

import { mutatePostCategorySearch } from '../mutatePostCategorySearch';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let space: Space;
let memberUser: User;
let adminUser: User;

let adminPostCategory: PostCategory;
let memberPostCategory: PostCategory;
let publicPostCategory: PostCategory;

// Test a space with 16 forum posts
beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  memberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  adminPostCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id,
    name: 'Admin Category'
  });

  memberPostCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id,
    name: 'Member Category'
  });
  await upsertPostCategoryPermission({
    permissionLevel: 'full_access',
    postCategoryId: memberPostCategory.id,
    assignee: { group: 'space', id: space.id }
  });

  publicPostCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id,
    name: 'Public Category'
  });
  await upsertPostCategoryPermission({
    permissionLevel: 'view',
    postCategoryId: publicPostCategory.id,
    assignee: { group: 'public' }
  });
});

describe('mutatePostCategorySearch', () => {
  it('should return an unmodified categoryId if the requester is an admin of the target space', async () => {
    const undefinedCategoryId = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: undefined,
      userId: adminUser.id
    });

    expect(undefinedCategoryId.categoryId).toEqual(undefined);

    const singleCategoryId = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: adminPostCategory.id,
      userId: adminUser.id
    });

    expect(singleCategoryId).toEqual({ categoryId: adminPostCategory.id });

    const multipleCategoryIds = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id, memberPostCategory.id],
      userId: adminUser.id
    });

    expect(multipleCategoryIds).toEqual({ categoryId: [adminPostCategory.id, memberPostCategory.id] });
  });

  it('should return an unmodified categoryId if the requester has space-wide moderator permissions', async () => {
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

    const undefinedCategoryId = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: undefined,
      userId: spaceWideForumModeratorUser.id
    });

    expect(undefinedCategoryId.categoryId).toEqual(undefined);

    const singleCategoryId = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: adminPostCategory.id,
      userId: spaceWideForumModeratorUser.id
    });

    expect(singleCategoryId).toEqual({ categoryId: adminPostCategory.id });

    const multipleCategoryIds = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id, memberPostCategory.id],
      userId: spaceWideForumModeratorUser.id
    });

    expect(multipleCategoryIds).toEqual({ categoryId: [adminPostCategory.id, memberPostCategory.id] });
  });

  it('should return only the subset of categoryIds the requester has access to in the target space, if categoryID is an array of categories', async () => {
    const multipleCategoryIds = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id, memberPostCategory.id],
      userId: memberUser.id
    });

    expect(multipleCategoryIds).toEqual({ categoryId: [memberPostCategory.id] });

    const noCategoryIdsLeft = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id],
      userId: memberUser.id
    });

    expect(noCategoryIdsLeft).toEqual({ categoryId: [] });

    // Public user test case
    const adminCategoryIdRequestedByPublicUser = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id],
      userId: undefined
    });

    expect(adminCategoryIdRequestedByPublicUser).toEqual({ categoryId: [] });

    const multipleCategoryIdsRequestedByPublicUser = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: [adminPostCategory.id, memberPostCategory.id, publicPostCategory.id],
      userId: undefined
    });

    expect(multipleCategoryIdsRequestedByPublicUser).toEqual({ categoryId: [publicPostCategory.id] });
  });

  it('should return the list of categoryIds the requester has access to in the target space, if category ID is undefined', async () => {
    const undefinedRequestedByMember = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: undefined,
      userId: memberUser.id
    });

    expect(undefinedRequestedByMember).toEqual({ categoryId: [memberPostCategory.id, publicPostCategory.id] });

    const undefinedRequestedByPublic = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: undefined,
      userId: undefined
    });

    expect(undefinedRequestedByPublic).toEqual({ categoryId: [publicPostCategory.id] });
  });

  it('should return an empty array if categoryIds is a string and the requester does not have access to it', async () => {
    const undefinedRequestedByMember = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: adminPostCategory.id,
      userId: memberUser.id
    });

    expect(undefinedRequestedByMember).toEqual({ categoryId: [] });

    const undefinedRequestedByPublic = await mutatePostCategorySearch({
      spaceId: space.id,
      categoryId: memberPostCategory.id,
      userId: undefined
    });

    expect(undefinedRequestedByPublic).toEqual({ categoryId: [] });
  });
});
