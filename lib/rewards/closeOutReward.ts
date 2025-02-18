import { prisma } from '@charmverse/core/prisma-client';

import { trackOpUserAction } from '../metrics/mixpanel/trackOpUserAction';

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

  const space = await prisma.space.findUnique({
    where: {
      id: reward.spaceId
    },
    select: {
      id: true,
      domain: true
    }
  });

  if (space?.domain === 'op-grants') {
    trackOpUserAction('reward_completed', {
      userId: reward.createdBy,
      rewardId
    });
  }

  return getRewardOrThrow({ rewardId });
}
