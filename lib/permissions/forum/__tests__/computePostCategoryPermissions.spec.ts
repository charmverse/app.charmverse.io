import { AvailablePostCategoryPermissions } from '@charmverse/core/permissions';
import type { PostCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/utils/errors';
import { PostCategoryNotFoundError } from '@root/lib/forums/categories/errors';
import { v4 } from 'uuid';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;
let postCategory: PostCategory;

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

  postCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id
  });
});

describe('computePostCategoryPermissions - public version', () => {
  it('should allow admins and space members to create posts and edit / delete a category', async () => {
    const adminPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: adminUser.id
    });

    const memberPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    expect(adminPermissions).toMatchObject<PostCategoryPermissionFlags>({
      create_post: true,
      delete_category: true,
      edit_category: true,
      manage_permissions: false,
      comment_posts: true,
      view_posts: true
    });

    expect(memberPermissions).toMatchObject<PostCategoryPermissionFlags>({
      create_post: true,
      delete_category: true,
      edit_category: true,
      manage_permissions: false,
      comment_posts: true,
      view_posts: true
    });
  });
  it('should return empty permissions for people outside the space', async () => {
    const publicPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id
    });

    const outsideUserPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: otherSpaceAdminUser.id
    });

    const emptyPermissions: PostCategoryPermissionFlags = new AvailablePostCategoryPermissions().empty;

    expect(publicPermissions).toEqual(emptyPermissions);

    expect(outsideUserPermissions).toEqual(emptyPermissions);
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
