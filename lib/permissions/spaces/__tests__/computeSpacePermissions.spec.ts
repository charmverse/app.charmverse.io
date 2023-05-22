import type { Space } from '@charmverse/core/prisma';
import type { User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { computeSpacePermissions } from '../computeSpacePermissions';
import type { SpacePermissionFlags } from '../interfaces';

let space: Space;
let adminUser: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });
  space = generated.space;
  adminUser = generated.user;
});

describe('computeSpacePermissions', () => {
  it('should return true to all permissions except moderate_forums and create_forum_category for all space members', async () => {
    const normalSpaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const normalMemberPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: normalSpaceMember.id
    });

    expect(normalMemberPermissions).toMatchObject<SpacePermissionFlags>({
      createBounty: true,
      createPage: true,
      reviewProposals: true,
      createForumCategory: false,
      moderateForums: false
    });
  });

  it('should return full permissions for the space admin user space permissions via their role', async () => {
    const adminPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: adminUser.id
    });

    expect(adminPermissions).toMatchObject<SpacePermissionFlags>({
      createBounty: true,
      createForumCategory: true,
      createPage: true,
      reviewProposals: true,
      moderateForums: true
    });
  });

  it('should return empty permissions for someone outside the space', async () => {
    const { user: outsideAdminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const outsideAdminPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: outsideAdminUser.id
    });

    expect(outsideAdminPermissions).toMatchObject<SpacePermissionFlags>({
      createBounty: false,
      createForumCategory: false,
      createPage: false,
      reviewProposals: false,
      moderateForums: false
    });
  });
});
