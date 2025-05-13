import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { generateBounty, generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';
import { DataNotFoundError } from '@packages/utils/errors';
import { v4 as uuid } from 'uuid';

import { getReward, getRewardOrThrow } from '../getReward';
import type { Reward, RewardWithUsers } from '../interfaces';

let space: Space;
let user: User;
let rewardId: string;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  user = generated.user;

  const bounty = await generateBounty({
    createdBy: user.id,
    spaceId: space.id,
    approveSubmitters: true,
    maxSubmissions: 5
  });

  rewardId = bounty.id; // Assuming bounty's id is the same as rewardId for simplicity
});

describe('getReward', () => {
  it('should return a reward when a valid reward ID is provided', async () => {
    const reward = await getReward({ rewardId });
    expect(reward).not.toBeNull();
    expect(reward?.id).toBe(rewardId);
  });

  it('should return a reward with the list of applications metadata', async () => {
    const rewardWithApplication = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: user.id
    });

    const submitterRole = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const reviewerRole = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const reviewerUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    await prisma.bountyPermission.createMany({
      data: [
        {
          permissionLevel: 'submitter',
          bountyId: rewardWithApplication.id,
          roleId: submitterRole.id
        },
        {
          permissionLevel: 'reviewer',
          bountyId: rewardWithApplication.id,
          roleId: reviewerRole.id
        },
        {
          permissionLevel: 'reviewer',
          bountyId: rewardWithApplication.id,
          userId: reviewerUser.id
        }
      ]
    });

    const reward = (await getReward({ rewardId: rewardWithApplication.id })) as Reward;
    expect(reward as RewardWithUsers).toMatchObject<Partial<RewardWithUsers>>({
      allowedSubmitterRoles: [submitterRole.id],
      reviewers: expect.arrayContaining([
        expect.objectContaining({ userId: reviewerUser.id }),
        expect.objectContaining({ roleId: reviewerRole.id })
      ]),
      applications: [
        {
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          createdBy: user.id,
          id: rewardWithApplication.applications[0].id,
          status: 'inProgress',
          walletAddress: null
        }
      ]
    });
  });

  it('should throw an error if an invalid reward ID is provided', async () => {
    await expect(getReward({ rewardId: 'some-invalid-id' })).rejects.toThrowError();
  });
});

describe('getRewardOrThrow', () => {
  it('should return a reward when a valid reward ID is provided', async () => {
    const reward = await getRewardOrThrow({ rewardId });
    expect(reward.id).toBe(rewardId);
  });

  it('should throw DataNotFoundError if an invalid reward ID is provided', async () => {
    await expect(getRewardOrThrow({ rewardId: 'some-invalid-id' })).rejects.toThrowError();
  });

  it('should throw DataNotFoundError if reward is not found', async () => {
    const randomUuid = uuid();
    await expect(getRewardOrThrow({ rewardId: randomUuid })).rejects.toThrow(DataNotFoundError);
  });
});
