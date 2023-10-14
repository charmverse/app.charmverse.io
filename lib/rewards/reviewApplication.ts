import type { Application, ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { WrongStateError } from 'lib/utilities/errors';

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
      status: true
    }
  });

  const reviewableStatuses: ApplicationStatus[] = ['applied', 'inProgress', 'review'];

  if (!reviewableStatuses.includes(application.status)) {
    throw new WrongStateError(
      `This application must be in one of these statuses to review: ${reviewableStatuses.join(',')}`
    );
  }

  const nextStatus: ApplicationStatus =
    decision === 'approve' ? (application.status === 'applied' ? 'inProgress' : 'complete') : 'rejected';

  const updated = (await prisma.application.update({
    where: {
      id: applicationId
    },
    data: {
      status: nextStatus,
      reviewedBy: userId
    }
  })) as Application;

  return updated;
}
