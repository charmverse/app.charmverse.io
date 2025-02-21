import { prisma, type Bounty, type Role, type Space, type User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { generateBounty } from '@packages/testing/setupDatabase';
import { InvalidInputError, PositiveNumbersOnlyError } from '@packages/utils/errors';
import { v4 as uuid } from 'uuid';

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
  it('should update other fields with valid data types', async () => {
    const submitterRole = await testUtilsMembers.generateRole({ spaceId: space.id, createdBy: user.id });
    const reviewerRole = await testUtilsMembers.generateRole({ spaceId: space.id, createdBy: user.id });

    const reviewers = [{ roleId: reviewerRole.id }, { userId: user.id }];

    const credentialTemplateId = uuid();

    const updateContent: UpdateableRewardFields = {
      rewardAmount: 1000,
      rewardToken: 'TOKEN',
      chainId: 12,
      approveSubmitters: false,
      dueDate: new Date(2025, 11, 31),
      allowMultipleApplications: true,
      maxSubmissions: 1000,
      customReward: 'Custom Reward Description',
      fields: ['Field1', 'Field2'],
      reviewers,
      allowedSubmitterRoles: [submitterRole.id],
      selectedCredentialTemplates: [credentialTemplateId]
    };

    const updatedReward = await updateRewardSettings({ rewardId: reward.id, updateContent });

    expect(updatedReward).toMatchObject(updateContent);
  });

  it('should updae fields to make reward assigned', async () => {
    const submitterRole = await testUtilsMembers.generateRole({ spaceId: space.id, createdBy: user.id });
    const reviewerRole = await testUtilsMembers.generateRole({ spaceId: space.id, createdBy: user.id });

    const reviewers = [{ roleId: reviewerRole.id }, { userId: user.id }];

    const updateContent: UpdateableRewardFields = {
      rewardAmount: 1000,
      rewardToken: 'TOKEN',
      chainId: 12,
      approveSubmitters: true,
      dueDate: new Date(2025, 11, 31),
      allowMultipleApplications: true,
      maxSubmissions: 1000,
      customReward: 'Custom Reward Description',
      fields: ['Field1', 'Field2'],
      reviewers,
      allowedSubmitterRoles: [submitterRole.id],
      assignedSubmitters: [user.id]
    };

    const updatedReward = await updateRewardSettings({ rewardId: reward.id, updateContent });

    expect(updatedReward).toMatchObject({
      rewardAmount: 1000,
      rewardToken: 'TOKEN',
      chainId: 12,
      approveSubmitters: false,
      dueDate: new Date(2025, 11, 31),
      allowMultipleApplications: false,
      maxSubmissions: 1,
      customReward: 'Custom Reward Description',
      fields: ['Field1', 'Field2'],
      reviewers,
      allowedSubmitterRoles: null,
      assignedSubmitters: [user.id]
    });
  });

  it('should make reward application required (from assigned)', async () => {
    const newReward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false
    });

    const updateContent: UpdateableRewardFields = {
      assignedSubmitters: [user.id]
    };

    const updatedReward = await updateRewardSettings({ rewardId: newReward.id, updateContent });

    expect(updatedReward.assignedSubmitters).toMatchObject([user.id]);

    const updatedReward2 = await updateRewardSettings({
      rewardId: reward.id,
      updateContent: { assignedSubmitters: null, approveSubmitters: true }
    });

    expect(updatedReward2.assignedSubmitters).toBe(null);
    expect(updatedReward2.approveSubmitters).toBe(true);
  });

  it('should set maxSubmissions without any prior submissions', async () => {
    const testReward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 0 // Initially no submissions limit
    });

    const updateContent = {
      maxSubmissions: 5
    };
    const updatedReward = await updateRewardSettings({ rewardId: testReward.id, updateContent });
    expect(updatedReward.maxSubmissions).toBe(5);
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
