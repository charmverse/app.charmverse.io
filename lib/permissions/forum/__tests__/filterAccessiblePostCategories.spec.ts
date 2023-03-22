import type { PostCategory, PostCategoryPermissionLevel, Space, User } from '@prisma/client';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { AvailablePostCategoryPermissions } from '../availablePostCategoryPermissions.class';
import { filterAccessiblePostCategories } from '../filterAccessiblePostCategories';
import { postCategoryPermissionsMapping } from '../mapping';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

// Post categories
let adminOnlyCategory: PostCategory;
let spaceOnlyCategory: PostCategory;
const spaceOnlyCategoryPermissionLevel: PostCategoryPermissionLevel = 'full_access';

let publicCategory: PostCategory;
const publicCategoryPermissionLevel: PostCategoryPermissionLevel = 'view';

let postCategories: PostCategory[];

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;

  adminOnlyCategory = await generatePostCategory({
    spaceId: space.id
  });

  spaceOnlyCategory = await generatePostCategory({
    spaceId: space.id
  });
  await upsertPostCategoryPermission({
    permissionLevel: spaceOnlyCategoryPermissionLevel,
    postCategoryId: spaceOnlyCategory.id,
    assignee: { group: 'space', id: space.id }
  });
  publicCategory = await generatePostCategory({
    spaceId: space.id
  });
  await upsertPostCategoryPermission({
    permissionLevel: publicCategoryPermissionLevel,
    postCategoryId: publicCategory.id,
    assignee: { group: 'public' }
  });

  postCategories = [adminOnlyCategory, spaceOnlyCategory, publicCategory];
});

describe('filterAccessiblePostCategories', () => {
  it('returns only categories a member can see, including public categories and create_post set to correct value', async () => {
    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: spaceMemberUser.id
    });

    const spaceCategoryPermissions = new AvailablePostCategoryPermissions();
    spaceCategoryPermissions.addPermissions(postCategoryPermissionsMapping[spaceOnlyCategoryPermissionLevel]);

    const publicCategoryPermissions = new AvailablePostCategoryPermissions();
    publicCategoryPermissions.addPermissions(postCategoryPermissionsMapping[publicCategoryPermissionLevel]);

    expect(visibleCategories.length).toBe(2);
    expect(visibleCategories).toContainEqual({
      ...spaceOnlyCategory,
      permissions: spaceCategoryPermissions.operationFlags
    });
    expect(visibleCategories).toContainEqual({
      ...publicCategory,
      permissions: publicCategoryPermissions.operationFlags
    });
  });
  it('returns all categories if user is admin, and create_post set to true', async () => {
    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: adminUser.id
    });

    const permissions = new AvailablePostCategoryPermissions().full;

    expect(visibleCategories.length).toBe(postCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns all categories if user is a spacewide forum moderator, and moderator permissions everywhere', async () => {
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

    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: spaceWideForumModeratorUser.id
    });

    const moderatorPermissions = new AvailablePostCategoryPermissions();
    moderatorPermissions.addPermissions(postCategoryPermissionsMapping.moderator);

    const moderatorPermissionFlags = moderatorPermissions.operationFlags;

    expect(visibleCategories.length).toBe(postCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, permissions: moderatorPermissionFlags });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, permissions: moderatorPermissionFlags });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions: moderatorPermissionFlags });
  });

  it('returns only categories accessible to the public if there is no user', async () => {
    const permissions = new AvailablePostCategoryPermissions().empty;

    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: undefined
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns only categories accessible to the public if user is not a space member', async () => {
    const permissions = new AvailablePostCategoryPermissions().empty;

    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: otherSpaceAdminUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns only categories accessible to the public if user is a guest of the space', async () => {
    const guestUser = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const permissions = new AvailablePostCategoryPermissions().empty;

    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: guestUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });
});
