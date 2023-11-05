import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from 'lib/utilities/errors';

import { paidRewardStatuses } from './constants';
import { getRewardOrThrow, rewardWithUsersInclude } from './getReward';
import type { RewardWithUsers } from './interfaces';
import { mapDbRewardToReward } from './mapDbRewardToReward';

export async function markRewardAsPaid(rewardId: string): Promise<RewardWithUsers> {
  const reward = await getRewardOrThrow({ rewardId });

  if (!reward.applications.every((application) => paidRewardStatuses.includes(application.status))) {
    throw new InvalidInputError('All applications need to be either completed or paid in order to mark reward as paid');
  }

  const completedApplications = reward.applications.filter((app) => app.status === 'complete');

  await prisma.application.updateMany({
    where: {
      id: {
        in: completedApplications.map((completedApplication) => completedApplication.id)
      }
    },
    data: {
      status: 'paid'
    }
  });

  return prisma.bounty
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
}
