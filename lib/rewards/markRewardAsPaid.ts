import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@root/lib/utils/errors';

import { paidRewardStatuses } from './constants';
import { getRewardOrThrow, rewardWithUsersInclude } from './getReward';
import type { RewardWithUsers } from './interfaces';
import { mapDbRewardToReward } from './mapDbRewardToReward';

export async function markRewardAsPaid(rewardId: string): Promise<RewardWithUsers> {
  const reward = await getRewardOrThrow({ rewardId });

  if (!reward.applications.every((application) => paidRewardStatuses.includes(application.status))) {
    throw new InvalidInputError('All applications need to be either completed or paid in order to mark reward as paid');
  }

  await prisma.application.updateMany({
    where: {
      id: {
        // Keep the status of the rejected applications as is
        in: reward.applications
          .filter((application) => application.status !== 'rejected' && application.status !== 'submission_rejected')
          .map((application) => application.id)
      }
    },
    data: {
      status: 'paid'
    }
  });

  const updatedReward = await prisma.bounty
    .update({
      where: {
        id: reward.id
      },
      data: {
        status: 'paid'
      },
      include: rewardWithUsersInclude()
    })
    .then(mapDbRewardToReward);

  return updatedReward;
}
