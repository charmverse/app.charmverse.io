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
  it('should return true to all permissions for all space members and admins', async () => {
    const normalSpaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const normalMemberPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: normalSpaceMember.id
    });

    const adminPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: adminUser.id
    });

    const fullPermissions: SpacePermissionFlags = {
      createBounty: true,
      createPage: true,
      reviewProposals: true,
      createForumCategory: true,
      moderateForums: true
    };

    expect(normalMemberPermissions).toMatchObject<SpacePermissionFlags>(fullPermissions);

    expect(adminPermissions).toMatchObject<SpacePermissionFlags>(fullPermissions);
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
