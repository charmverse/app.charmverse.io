import { prisma } from '@charmverse/core/prisma-client';

import { issueRewardCredentialsIfNecessary } from 'lib/credentials/issueRewardCredentialsIfNecessary';

import { submissionIsComplete } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';
import type { RewardWithUsers } from './interfaces';

export async function closeOutReward(rewardId: string): Promise<RewardWithUsers> {
  const reward = await getRewardOrThrow({ rewardId });

  const applicationsToReject = reward.applications
    .filter((app) => !submissionIsComplete({ application: app }))
    .map((app) => app.id);

  await prisma.$transaction([
    prisma.application.updateMany({
      where: {
        id: { in: applicationsToReject }
      },
      data: {
        status: 'rejected'
      }
    }),
    prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        status: 'complete'
      }
    })
  ]);

  await issueRewardCredentialsIfNecessary({
    event: 'reward_submission_approved',
    rewardId
  });

  return getRewardOrThrow({ rewardId });
}
