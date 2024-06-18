import { testUtilsUser } from '@charmverse/core/test';

import type { RewardCreationData } from '../createReward';
import { createReward } from '../createReward';
import { getRewardTemplates } from '../getRewardTemplates';

describe('getRewardTemplates', () => {
  it(`Should return all reward templates even drafted ones for a space admin`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const nonAdminUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const rewardData: RewardCreationData = {
      spaceId: space.id,
      userId: nonAdminUser.id,
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      pageProps: {
        title: 'reward page',
        type: 'bounty_template'
      },
      reviewers: [
        {
          userId: nonAdminUser.id
        }
      ]
    };

    const draftRewardData: RewardCreationData = {
      ...rewardData,
      isDraft: true
    };

    await Promise.all([createReward(rewardData), createReward(draftRewardData)]);

    const rewardTemplates = await getRewardTemplates({
      spaceId: space.id,
      userId: user.id
    });

    expect(rewardTemplates.length).toBe(2);
  });

  it(`Should return reward templates created by member for a space member`, async () => {
    const { user: spaceMember, space } = await testUtilsUser.generateUserAndSpace();

    const rewardAuthor = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const rewardData: RewardCreationData = {
      spaceId: space.id,
      userId: rewardAuthor.id,
      approveSubmitters: true,
      maxSubmissions: 10,
      dueDate: new Date(),
      customReward: 'Special Badge',
      fields: { fieldName: 'sampleField', type: 'text' },
      pageProps: {
        title: 'reward page',
        type: 'bounty_template'
      },
      reviewers: [
        {
          userId: rewardAuthor.id
        }
      ]
    };

    const draftRewardData: RewardCreationData = {
      ...rewardData,
      isDraft: true
    };

    const [reward1] = await Promise.all([createReward(rewardData), createReward(draftRewardData)]);

    const rewardTemplates = await getRewardTemplates({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(rewardTemplates.length).toBe(1);
    expect(rewardTemplates[0].id).toBe(reward1.reward.id);
  });
});
