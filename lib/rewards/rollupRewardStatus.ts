import type { ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { countValueOccurrences } from '../utilities/numbers';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';
import type { RewardStatus, RewardWithUsers } from './interfaces';

export async function rollupRewardStatus({ rewardId }: { rewardId: string }): Promise<RewardWithUsers> {
  const reward = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: rewardId
    },
    select: {
      status: true,
      maxSubmissions: true,
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  const capReached = countRemainingSubmissionSlots({
    applications: reward.applications,
    limit: reward.maxSubmissions
  });

  let newStatus: RewardStatus | null = null;

  if (capReached) {
    newStatus = 'open';
  } else {
    const submissionSummary = countValueOccurrences<ApplicationStatus>(reward.applications, 'status');
    if (submissionSummary.complete > 0) {
      newStatus = 'complete';
    } else if (submissionSummary.paid === reward.maxSubmissions) {
      newStatus = 'paid';
    }
  }

  if (newStatus && newStatus !== reward.status) {
    await prisma.bounty.update({
      where: {
        id: rewardId
      },
      data: {
        status: newStatus
      },
      select: {
        id: true
      }
    });
  }

  return getRewardOrThrow({ rewardId });
}
