import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/core/errors';
import { countRemainingSubmissionSlots } from '@packages/lib/rewards/countRemainingSubmissionSlots';
import { getReward } from '@packages/lib/rewards/getReward';

export async function verifyOrRejectApplications(rewardId: string) {
  const reward = await getReward({ rewardId });

  if (!reward) {
    throw new DataNotFoundError(`Reward with id ${rewardId} not found`);
  }

  const slotsLeft = countRemainingSubmissionSlots({
    applications: reward.applications ?? [],
    limit: reward.maxSubmissions
  });

  const hasSlot = slotsLeft === null || slotsLeft > 0;

  if (hasSlot) {
    return true;
  }

  // close all pending applications
  const applicationsToReject = reward.applications.filter((app) =>
    ['applied', 'review', 'inProgress'].includes(app.status)
  );

  await prisma.$transaction(
    applicationsToReject.map((app) =>
      prisma.application.update({
        where: {
          id: app.id
        },
        data: {
          status: app.status === 'applied' ? 'rejected' : 'submission_rejected'
        }
      })
    )
  );

  return false;
}
