import type { TargetPermissionGroup } from '@charmverse/core/dist/cjs/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { PagePermission, Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsPages, testUtilsUser } from '@charmverse/core/test';

import { PositiveNumbersOnlyError } from 'lib/utilities/errors';

import type { RewardCreationData } from '../createReward';
import { createReward } from '../createReward';
import type { Reward } from '../interfaces';

let user: User;
let space: Space;
let submitterRole: Role;
let reviewerRole: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  submitterRole = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
  reviewerRole = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('createReward', () => {
  it('should successfully create a reward with all parameters from UpdateableRewardFields including reviewers and allowedSubmitterRoles', async () => {
    const reviewers: TargetPermissionGroup<'role' | 'user'>[] = [
      { id: user.id, group: 'user' },
      { id: reviewerRole.id, group: 'role' }
    ];

    const rewardData: RewardCreationData = {
      spaceId: space.id,
      userId: user.id,
      chainId: 2,
      rewardAmount: 100,
      rewardToken: 'ETH',
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      reviewers,
      allowedSubmitterRoles: [submitterRole.id]
    };

    const reward = await createReward(rewardData);

    expect(reward).toMatchObject({
      chainId: 2,
      rewardAmount: 100,
      rewardToken: 'ETH',
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: expect.any(Date),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      reviewers: expect.arrayContaining(reviewers),
      allowedSubmitterRoles: [submitterRole.id]
    });
  });

  it('should auto-create a reward with default parameters if just the user and spaceId', async () => {
    const rewardData = {
      spaceId: space.id,
      userId: user.id
    };

    const reward = await createReward(rewardData);

    expect(reward).toMatchObject<Partial<Reward>>({
      chainId: 1,
      rewardToken: 'ETH',
      rewardAmount: 0.1
    });
  });

  it('should successfully add a reward to an existing page and the page should have a page.bountyId equal to reward.id', async () => {
    const testPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    // Create a reward for this page
    const rewardData: RewardCreationData = {
      spaceId: space.id,
      userId: user.id,
      linkedPageId: testPage.id,
      chainId: 2,
      rewardAmount: 100,
      rewardToken: 'BTC',
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      reviewers: [
        { id: user.id, group: 'user' },
        { id: reviewerRole.id, group: 'role' }
      ],
      allowedSubmitterRoles: [submitterRole.id]
    };

    const reward = await createReward(rewardData);

    // Assuming you now add this reward to a page or it's added in the createReward function
    // Fetch the page to check if the reward is attached
    const page = await prisma.page.findUnique({
      where: {
        id: testPage.id
      }
    });

    expect(page).toMatchObject({
      ...testPage,
      bountyId: reward.id
    });
  });

  it('should add a full acccess page permission for the creator, and a view permission for the space', async () => {
    const rewardData: RewardCreationData = {
      spaceId: space.id,
      userId: user.id,
      chainId: 2,
      rewardAmount: 100,
      rewardToken: 'BTC',
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      reviewers: [
        { id: user.id, group: 'user' },
        { id: reviewerRole.id, group: 'role' }
      ],
      allowedSubmitterRoles: [submitterRole.id]
    };

    const reward = await createReward(rewardData);

    const permissions = await prisma.pagePermission.findMany({
      where: {
        pageId: reward.id
      }
    });

    expect(permissions).toEqual(
      expect.arrayContaining<PagePermission>([
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: reward.id,
          permissionLevel: 'full_access',
          permissions: [],
          userId: user.id,
          public: null,
          roleId: null,
          spaceId: null
        },
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: reward.id,
          permissionLevel: 'view',
          permissions: [],
          public: null,
          userId: null,
          roleId: null,
          spaceId: space.id
        }
      ])
    );
  });

  it('should throw a PositiveNumbersOnlyError if rewardAmount is negative', async () => {
    const rewardData = {
      spaceId: space.id,
      userId: user.id,
      rewardAmount: -5
    };

    await expect(createReward(rewardData)).rejects.toThrow(PositiveNumbersOnlyError);
  });

  it('should throw a NotFoundError if space is not found', async () => {
    const rewardData: RewardCreationData = {
      spaceId: 'non-existent-space-id',
      userId: user.id,
      rewardAmount: 2
    };

    await expect(createReward(rewardData)).rejects.toThrowError();
  });
});
