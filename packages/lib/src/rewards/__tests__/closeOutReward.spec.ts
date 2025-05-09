import type { Application, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBounty } from '@packages/testing/setupDatabase';

import { closeOutReward } from '../closeOutReward';
import type { Reward } from '../interfaces';

describe('closeOutReward', () => {
  let user: User;
  let space: Space;
  let reward: Reward;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace());
    reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 5
    });
  });
  it('successfully closes out a reward and marks all open and in progress applications as rejected', async () => {
    await prisma.application.createMany({
      data: [
        { bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'paid' },
        { bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'complete' },
        { bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'inProgress' },
        { bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'applied' },
        { bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'complete' }
      ]
    });

    const updatedReward = await closeOutReward(reward.id);

    expect(updatedReward.status).toEqual('complete');

    expect(updatedReward.applications).toEqual(
      expect.arrayContaining<Partial<Application>>([
        expect.objectContaining({ createdBy: user.id, status: 'paid' }),
        expect.objectContaining({ createdBy: user.id, status: 'complete' }),
        expect.objectContaining({ createdBy: user.id, status: 'complete' }),
        expect.objectContaining({ createdBy: user.id, status: 'rejected' }),
        expect.objectContaining({ createdBy: user.id, status: 'rejected' })
      ])
    );
  });

  it('throws an error if reward does not exist', async () => {
    await expect(closeOutReward('nonExistentRewardId')).rejects.toThrow();
  });
});
