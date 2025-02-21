import type { Application, ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { WrongStateError } from '@packages/utils/errors';
import { verifyOrRejectApplications } from '@root/lib/rewards/verifyOrRejectApplications';

import { rollupRewardStatus } from './rollupRewardStatus';

export type ReviewDecision = 'approve' | 'reject';

export type ApplicationReview = {
  applicationId: string;
  userId: string;
  decision: ReviewDecision;
};

/**
 * Use this for reviewing applications or approving submissions
 */
export async function reviewApplication({ applicationId, decision, userId }: ApplicationReview): Promise<Application> {
  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id: applicationId
    },
    select: {
      status: true,
      bountyId: true
    }
  });

  if (decision === 'approve') {
    // if there are no slots left, reject all the applications for this reward
    const canBeAccepted = await verifyOrRejectApplications(application.bountyId);
    if (!canBeAccepted) {
      throw new WrongStateError('This reward has no more slots left');
    }
  }

  const reviewableStatuses: ApplicationStatus[] = ['applied', 'inProgress', 'review'];

  if (!reviewableStatuses.includes(application.status)) {
    throw new WrongStateError(
      `This application must be in one of these statuses to review: ${reviewableStatuses.join(',')}`
    );
  }

  const approveStatus: ApplicationStatus = application.status === 'applied' ? 'inProgress' : 'complete';

  const rejectStatus: ApplicationStatus = application.status === 'applied' ? 'rejected' : 'submission_rejected';

  const nextStatus = decision === 'approve' ? approveStatus : rejectStatus;

  const updated = (await prisma.application.update({
    where: {
      id: applicationId
    },
    data: {
      status: nextStatus,
      reviewedBy: nextStatus !== 'inProgress' ? userId : undefined,
      // We only use this field when tracking who accepted an application (if the reward requires applications before submitting)
      acceptedBy: nextStatus === 'inProgress' ? userId : undefined
    }
  })) as Application;

  await verifyOrRejectApplications(application.bountyId);
  await rollupRewardStatus({ rewardId: application.bountyId });

  return updated;
}
