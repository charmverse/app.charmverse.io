import type { User, Space, PostCategory } from '@prisma/client';

import { generateUserAndSpace, generateSpaceUser } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

import { filterAccessiblePostCategories } from '../filterAccessiblePostCategories';
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
let publicCategory: PostCategory;
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
    permissionLevel: 'member',
    postCategoryId: spaceOnlyCategory.id,
    assignee: { group: 'space', id: space.id }
  });
  publicCategory = await generatePostCategory({
    spaceId: space.id
  });
  await upsertPostCategoryPermission({
    permissionLevel: 'guest',
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

    expect(visibleCategories.length).toBe(2);
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, create_post: true });
    expect(visibleCategories).toContainEqual({ ...publicCategory, create_post: false });
  });
  it('returns all categories if user is admin, and create_post set to true', async () => {
    const visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: adminUser.id
    });

    expect(visibleCategories.length).toBe(postCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, create_post: true });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, create_post: true });
    expect(visibleCategories).toContainEqual({ ...publicCategory, create_post: true });
  });

  it('returns only categories accessible to the public if there is no user, or user is not a space member, and create_post set to false', async () => {
    let visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: otherSpaceAdminUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, create_post: false });

    visibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId: undefined
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, create_post: false });
  });
});
