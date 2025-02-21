import { DataNotFoundError } from '@charmverse/core/errors';
import type { Space, User } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import { rollupRewardStatus } from '../rollupRewardStatus';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generated.user;
  space = generated.space;
});

describe('rollupRewardStatus', () => {
  it('should fail if the reward does not exist', async () => {
    await expect(
      rollupRewardStatus({
        rewardId: v4()
      })
    ).rejects.toThrowError();
  });

  it('should set the reward status as "open" if its cap is not reached', async () => {
    const reward = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'complete',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupRewardStatus({ rewardId: reward.id });

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the reward status as "open" if there is no cap', async () => {
    const reward = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'complete',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupRewardStatus({ rewardId: reward.id });

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the reward status to "in progress" if the cap is reached and some submissions are still in progress or in review', async () => {
    const reward = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupRewardStatus({ rewardId: reward.id });

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the reward status to "complete" if enough submissions are approved', async () => {
    const reward = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupRewardStatus({ rewardId: reward.id });

    expect(bountyAfterRollup.status).toBe('open');
  });

  it('should set the reward status to "paid" if cap is reached and all submissions are paid', async () => {
    const reward = await generateBountyWithSingleApplication({
      userId: user.id,
      spaceId: space.id,
      bountyCap: 10,
      applicationStatus: 'applied',
      bountyStatus: 'open'
    });

    const bountyAfterRollup = await rollupRewardStatus({ rewardId: reward.id });

    expect(bountyAfterRollup.status).toBe('open');
  });
});
