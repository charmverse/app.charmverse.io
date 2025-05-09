import type { BountyStatus } from '@charmverse/core/prisma-client';

import type { Reward } from './interfaces';

// Allow ability to lock submissions only if the bounty is in status to receive new submissions.
export function isRewardLockable(reward: Pick<Reward, 'status'>): boolean {
  const lockableStatuses: BountyStatus[] = ['open'];

  return lockableStatuses.includes(reward.status);
}

export const statusesAcceptingNewWork: BountyStatus[] = ['open'];
