import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBounty, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';

import { AvailableBountyPermissions } from '../availableBountyPermissions';
import { computeBountyPermissionsPublic } from '../computeBountyPermissions.public';

describe('computeBountyPermissions - public', () => {
  it('should allow any space member to work on the reward', async () => {
    const { space, user: adminUser } = await generateUserAndSpace({ isAdmin: true, paidTier: 'free' });
    const spaceMember = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const reward = await generateBounty({
      createdBy: adminUser.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const rewardWithSpace = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: reward.id
      },
      include: {
        space: true,
        permissions: true
      }
    });

    const adminPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: adminUser.id
    });

    expect(adminPermissions.work).toBe(true);

    const memberPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: spaceMember.id
    });

    expect(memberPermissions.work).toBe(true);
  });

  it('should provide full permissions to reward creator', async () => {
    const { space, user: creator } = await generateUserAndSpace({ isAdmin: false, paidTier: 'free' });

    const reward = await generateBounty({
      createdBy: creator.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const rewardWithSpace = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: reward.id
      },
      include: {
        space: true,
        permissions: true
      }
    });

    const creatorPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: creator.id
    });

    expect(creatorPermissions).toMatchObject(new AvailableBountyPermissions().full);
  });

  it('should provide review permission to user marked as reviewer', async () => {
    const { space, user: creator } = await generateUserAndSpace({ isAdmin: false, paidTier: 'free' });
    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const reviewerMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const reward = await generateBounty({
      createdBy: creator.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await prisma.bountyPermission.create({
      data: {
        bounty: { connect: { id: reward.id } },
        permissionLevel: 'reviewer',
        user: { connect: { id: reviewerMember.id } }
      }
    });

    const rewardWithSpace = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: reward.id
      },
      include: {
        space: true,
        permissions: true
      }
    });

    const reviewerPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: reviewerMember.id
    });

    const memberPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: spaceMember.id
    });

    expect(reviewerPermissions.review).toBe(true);
    expect(memberPermissions.review).toBe(false);
  });

  it('should not provide any reward permissions to outside users ', async () => {
    const { space, user: adminUser } = await generateUserAndSpace({ isAdmin: true, paidTier: 'free' });

    const outsideUser = await testUtilsUser.generateUser();

    const reward = await generateBounty({
      createdBy: adminUser.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const rewardWithSpace = await prisma.bounty.findUniqueOrThrow({
      where: {
        id: reward.id
      },
      include: {
        space: true,
        permissions: true
      }
    });

    const outsidePermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: outsideUser.id
    });

    expect(outsidePermissions).toMatchObject(new AvailableBountyPermissions().empty);

    const publicPermissions = await computeBountyPermissionsPublic({
      bounty: rewardWithSpace,
      userId: undefined
    });

    expect(publicPermissions).toMatchObject(new AvailableBountyPermissions().empty);
  });
});
