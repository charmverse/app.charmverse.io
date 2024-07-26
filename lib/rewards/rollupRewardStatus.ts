import type { ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { countValueOccurrences } from '../utils/numbers';

import { countRemainingSubmissionSlots } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';
import type { RewardStatus, RewardWithUsers } from './interfaces';

export async function rollupRewardStatus({ rewardId }: { rewardId: string }): Promise<RewardWithUsers> {
  const reward = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: rewardId
    },
    select: {
      space: {
        select: {
          domain: true
        }
      },
      createdBy: true,
      status: true,
      maxSubmissions: true,
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  if (reward.status === 'draft') {
    return getRewardOrThrow({ rewardId });
  }

  const remainingSlots = countRemainingSubmissionSlots({
    applications: reward.applications,
    limit: reward.maxSubmissions
  });

  let newStatus: RewardStatus | null = null;

  if (remainingSlots === null || remainingSlots > 0) {
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
