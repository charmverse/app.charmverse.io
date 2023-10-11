import { prisma } from '@charmverse/core/prisma-client';

import { countValidSubmissions, submissionIsValid } from './countRemainingSubmissionSlots';
import { getRewardOrThrow } from './getReward';
import type { RewardWithUsers } from './interfaces';

export async function closeOutReward(rewardId: string): Promise<RewardWithUsers> {
  const reward = await getRewardOrThrow({ rewardId });

  const validSubmissions = countValidSubmissions({ applications: reward.applications });

  const applicationsToReject = reward.applications
    .filter((app) => !submissionIsValid({ application: app }))
    .map((app) => app.id);

  await prisma.application.updateMany({
    where: {
      OR: applicationsToReject.map((appId) => {
        return { id: appId };
      })
    },
    data: {
      status: 'rejected'
    }
  });

  const validSubmissionsAfterUpdate = validSubmissions - applicationsToReject.length;

  await prisma.bounty.update({
    where: {
      id: reward.id
    },
    data: {
      status: 'complete',
      maxSubmissions: validSubmissionsAfterUpdate
    },
    select: {
      id: true
    }
  });

  return getRewardOrThrow({
    rewardId
  });
}
