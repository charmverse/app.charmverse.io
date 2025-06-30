import type { Space } from '@charmverse/core/prisma';
import type { User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { SpacePermissionFlags } from '@packages/core/permissions';

import { computeSpacePermissionsForFreeSpace } from '../computeSpacePermissionsForFreeSpace';

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
  it('should return all permissions except deleteAnyPage/Bounty/Proposal for space members', async () => {
    const normalSpaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const normalMemberPermissions = await computeSpacePermissionsForFreeSpace({
      resourceId: space.id,
      userId: normalSpaceMember.id
    });

    expect(normalMemberPermissions).toMatchObject<SpacePermissionFlags>({
      createBounty: true,
      createForumCategory: true,
      createPage: true,
      moderateForums: true,
      reviewProposals: true,
      deleteAnyBounty: false,
      deleteAnyPage: false,
      deleteAnyProposal: false,
      createProposals: true
    });
  });

  it('should return true to all permissions for admins', async () => {
    const adminPermissions = await computeSpacePermissionsForFreeSpace({
      resourceId: space.id,
      userId: adminUser.id
    });

    const fullPermissions: SpacePermissionFlags = {
      createBounty: true,
      createPage: true,
      reviewProposals: true,
      createForumCategory: true,
      moderateForums: true,
      deleteAnyBounty: true,
      deleteAnyPage: true,
      deleteAnyProposal: true,
      createProposals: true
    };
    expect(adminPermissions).toMatchObject<SpacePermissionFlags>(fullPermissions);
  });

  it('should return empty permissions for someone outside the space', async () => {
    const { user: outsideAdminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const outsideAdminPermissions = await computeSpacePermissionsForFreeSpace({
      resourceId: space.id,
      userId: outsideAdminUser.id
    });

    expect(outsideAdminPermissions).toMatchObject<SpacePermissionFlags>({
      createBounty: false,
      createForumCategory: false,
      createPage: false,
      reviewProposals: false,
      moderateForums: false,
      deleteAnyBounty: false,
      deleteAnyPage: false,
      deleteAnyProposal: false,
      createProposals: false
    });
  });
});
