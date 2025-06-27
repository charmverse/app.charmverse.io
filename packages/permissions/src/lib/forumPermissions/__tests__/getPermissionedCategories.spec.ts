import type { PostCategory, PostCategoryPermissionLevel, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { AvailablePostCategoryPermissions } from '@packages/core/permissions';

import { addSpaceOperations } from 'lib/spacePermissions/addSpaceOperations';

import { getPermissionedCategories } from '../getPermissionedCategories';
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
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;

  adminOnlyCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id
  });

  spaceOnlyCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id
  });
  await upsertPostCategoryPermission({
    permissionLevel: spaceOnlyCategoryPermissionLevel,
    postCategoryId: spaceOnlyCategory.id,
    assignee: { group: 'space', id: space.id }
  });
  publicCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id
  });
  await upsertPostCategoryPermission({
    permissionLevel: publicCategoryPermissionLevel,
    postCategoryId: publicCategory.id,
    assignee: { group: 'public' }
  });

  postCategories = [adminOnlyCategory, spaceOnlyCategory, publicCategory];
});

describe('getPermissionedCategories', () => {
  it('returns only categories a member can see, including public categories and create_post set to correct value', async () => {
    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: spaceMemberUser.id
    });

    const spaceCategoryPermissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false });
    spaceCategoryPermissions.addPermissions(postCategoryPermissionsMapping[spaceOnlyCategoryPermissionLevel]);

    const publicCategoryPermissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false });
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
    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: adminUser.id
    });

    const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false }).full;

    expect(visibleCategories.length).toBe(postCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns all categories if user is a spacewide forum moderator, and moderator permissions everywhere', async () => {
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
      assignee: {
        group: 'role',
        id: role.id
      },
      operations: ['moderateForums']
    });

    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: spaceWideForumModeratorUser.id
    });

    const moderatorPermissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false });
    moderatorPermissions.addPermissions(postCategoryPermissionsMapping.moderator);

    const moderatorPermissionFlags = moderatorPermissions.operationFlags;

    expect(visibleCategories.length).toBe(postCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, permissions: moderatorPermissionFlags });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, permissions: moderatorPermissionFlags });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions: moderatorPermissionFlags });
  });

  it('returns only categories accessible to the public if there is no user', async () => {
    const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false }).empty;

    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: undefined
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns only categories accessible to the public if user is not a space member', async () => {
    const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false }).empty;

    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: otherSpaceAdminUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  it('returns only categories accessible to the public if user is a guest of the space', async () => {
    const guestUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace: false }).empty;

    const visibleCategories = await getPermissionedCategories({
      postCategories,
      userId: guestUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });
});
