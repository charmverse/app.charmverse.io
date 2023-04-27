import { AvailablePostCategoryPermissions, generatePostCategory } from '@charmverse/core';
import type { PostCategory, Space, User } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import type { AvailablePostCategoryPermissionFlags } from '../interfaces';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;
let postCategory: PostCategory;

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

  postCategory = await generatePostCategory({
    spaceId: space.id
  });
});

describe('computePostCategoryPermissions - public version', () => {
  it('should return full permissions for the admin', async () => {
    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: adminUser.id
    });

    const fullPermissions = new AvailablePostCategoryPermissions().full;

    expect(permissions).toEqual(fullPermissions);
  });

  it('should only allow space members to create posts', async () => {
    const permissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: spaceMemberUser.id
    });

    const createPermissions: AvailablePostCategoryPermissionFlags = {
      ...new AvailablePostCategoryPermissions().empty,
      create_post: true
    };

    expect(permissions).toEqual(createPermissions);
  });

  it('should return empty permissions for people outside the space', async () => {
    const publicPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id
    });

    const outsideUserPermissions = await computePostCategoryPermissions({
      resourceId: postCategory.id,
      userId: otherSpaceAdminUser.id
    });

    const emptyPermissions: AvailablePostCategoryPermissionFlags = new AvailablePostCategoryPermissions().empty;

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
