import { prisma } from '@charmverse/core/prisma-client';

import { issueRewardCredentialsIfNecessary } from 'lib/credentials/issueRewardCredentialsIfNecessary';

import type { RewardWithUsers } from './interfaces';
import { rollupRewardStatus } from './rollupRewardStatus';

export async function lockApplicationAndSubmissions({
  rewardId,
  lock
}: {
  rewardId: string;
  lock?: boolean;
}): Promise<RewardWithUsers> {
  await prisma.bounty.update({
    where: {
      id: rewardId
    },
    data: {
      submissionsLocked: lock ?? true
    }
  });

  const rollup = await rollupRewardStatus({ rewardId });

  await issueRewardCredentialsIfNecessary({
    event: 'reward_submission_approved',
    rewardId
  });

  return rollup;
}
