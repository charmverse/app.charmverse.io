import { prisma } from '@charmverse/core/prisma-client';

import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { computeBountyPermissionsPublic } from '../computeBountyPermissions.public';
import type { BountyPermissionFlags } from '../interfaces';

describe('computeBountyPermissions - public space', () => {
  it('should provide creator permissions to the bounty creator', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false,
      // We don't need the paid tier to be set for this test, since we are directly calling the free space implementation
      paidTier: 'free'
    });

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open'
    });

    const bountyData = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: bounty.id
      },
      include: {
        permissions: true
      }
    });

    const creatorPermissions = await computeBountyPermissionsPublic({
      bounty: bountyData,
      userId: user.id
    });

    expect(creatorPermissions).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: true,
      lock: true,
      mark_paid: true,
      review: true,
      work: true
    });
  });

  it('should always allow space members to work on the bounty (except the creator)', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const spaceMember = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open'
    });

    const bountyData = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: bounty.id
      },
      include: {
        permissions: true
      }
    });

    const memberPermissions = await computeBountyPermissionsPublic({
      bounty: bountyData,
      userId: spaceMember.id
    });

    expect(memberPermissions).toMatchObject<BountyPermissionFlags>({
      approve_applications: false,
      grant_permissions: false,
      lock: false,
      mark_paid: false,
      review: false,
      work: true
    });
  });

  it('should assign reviewer permissions to selected users', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const reviewerUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const reviewerUserByRole = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [reviewerUserByRole.id]
    });

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      bountyPermissions: {
        reviewer: [
          { group: 'role', id: role.id },
          { group: 'user', id: reviewerUser.id }
        ]
      }
    });

    const bountyData = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: bounty.id
      },
      include: {
        permissions: true
      }
    });

    const reviewerUserPermissions = await computeBountyPermissionsPublic({
      bounty: bountyData,
      userId: reviewerUser.id
    });

    // In free space mode, we do not want role-based permissions to be assigned
    const reviewerUserByRolePermissions = await computeBountyPermissionsPublic({
      bounty: bountyData,
      userId: reviewerUserByRole.id
    });

    expect(reviewerUserPermissions.review).toBe(true);
    expect(reviewerUserByRolePermissions.review).toBe(false);
  });

  it('should always return full permissions for the space admin, except working on their own bounty', async () => {
    const { space, user: adminUser } = await generateUserAndSpace({ isAdmin: true });
    const user = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const memberBounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open'
    });

    const adminBounty = await generateBounty({
      approveSubmitters: false,
      createdBy: adminUser.id,
      spaceId: space.id,
      status: 'open'
    });

    const [memberBountyData, adminBountyData] = await Promise.all([
      prisma.bounty.findUniqueOrThrow({
        where: {
          id: memberBounty.id
        },
        include: {
          permissions: true
        }
      }),
      prisma.bounty.findUniqueOrThrow({
        where: {
          id: adminBounty.id
        },
        include: {
          permissions: true
        }
      })
    ]);

    const memberBountyPermissions = await computeBountyPermissionsPublic({
      bounty: memberBountyData,
      userId: adminUser.id
    });

    expect(memberBountyPermissions).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: true,
      lock: true,
      mark_paid: true,
      review: true,
      work: true
    });

    const adminBountyPermissions = await computeBountyPermissionsPublic({
      bounty: adminBountyData,
      userId: adminUser.id
    });

    expect(adminBountyPermissions).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: true,
      lock: true,
      mark_paid: true,
      review: true,
      // Everything except working on their own bounty
      work: false
    });
  });
});
