import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import { prisma, type Bounty, type Role, type Space, type User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { InvalidInputError, PositiveNumbersOnlyError } from 'lib/utilities/errors';
import { generateBounty } from 'testing/setupDatabase';

import type { UpdateableRewardFields } from '../updateRewardSettings';
import { updateRewardSettings } from '../updateRewardSettings';

let user: User;
let space: Space;
let reward: Bounty;
let role1: Role;
let role2: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;

  reward = await generateBounty({
    createdBy: user.id,
    spaceId: space.id,
    approveSubmitters: true,
    maxSubmissions: 5
  });

  role1 = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });

  role2 = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('updateRewardSettings', () => {
  it('should update reward settings for valid input', async () => {
    const updateContent = {
      rewardAmount: 1000,
      rewardToken: 'TOKEN'
    };
    const updatedReward = await updateRewardSettings({ rewardId: reward.id, updateContent });
    expect(updatedReward.rewardAmount).toBe(1000);
    expect(updatedReward.rewardToken).toBe('TOKEN');
  });

  it('should set allowed submitter roles and reviewers', async () => {
    const reviewers: TargetPermissionGroup<'user'>[] = [{ group: 'user', id: user.id }];

    const updateContent: UpdateableRewardFields = {
      allowedSubmitterRoles: [role1.id, role2.id],
      reviewers
    };
    const updatedReward = await updateRewardSettings({ rewardId: reward.id, updateContent });
    expect(updatedReward.allowedSubmitterRoles).toEqual([role1.id, role2.id]);
    expect(updatedReward.reviewers).toEqual(reviewers);
  });

  it('should throw InvalidInputError for non-UUID rewardId', async () => {
    await expect(updateRewardSettings({ rewardId: 'invalid-id', updateContent: {} })).rejects.toThrow(
      InvalidInputError
    );
  });

  it('should throw PositiveNumbersOnlyError for non-positive rewardAmount', async () => {
    const updateContent = {
      rewardAmount: -1
    };
    await expect(updateRewardSettings({ rewardId: reward.id, updateContent })).rejects.toThrow(
      PositiveNumbersOnlyError
    );
  });

  it('should throw InvalidInputError when maxSubmissions is lower than total of active and valid submissions', async () => {
    const testReward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 3
    });

    await prisma.application.createMany({
      data: [1, 2, 3, 4].map(() => ({
        bountyId: testReward.id,
        createdBy: user.id,
        spaceId: space.id,
        status: 'complete'
      }))
    });

    const updateContent = {
      maxSubmissions: 1 // Assuming there are more than 1 active and valid submissions
    };
    await expect(updateRewardSettings({ rewardId: testReward.id, updateContent })).rejects.toThrow(InvalidInputError);
  });
});
