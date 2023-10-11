import type { Application, ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { DataNotFoundError, InvalidInputError, UndesirableOperationError, WrongStateError } from 'lib/utilities/errors';

import { getApplication } from '../getApplication';
import type { ReviewDecision, SubmissionReview } from '../interfaces';

const submissionStatusAfterDecision: Record<ReviewDecision, ApplicationStatus> = {
  approve: 'complete',
  reject: 'rejected'
};

/**
 * Accept, reject or request changes for the work
 * @returns
 */
export async function reviewSubmission({ submissionId, decision, userId }: SubmissionReview): Promise<Application> {
  const submission = await getApplication(submissionId);

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${submissionId} was not found`);
  }

  if (submission.createdBy === userId) {
    throw new UndesirableOperationError('You cannot review your own submission');
  }

  if (submission.status !== 'inProgress' && submission.status !== 'review') {
    throw new WrongStateError('Submissions must be in progress or in review for you to approve or reject them');
  }

  const correspondingSubmissionStatus = submissionStatusAfterDecision[decision];

  if (!correspondingSubmissionStatus) {
    throw new InvalidInputError(`Decision ${decision} is invalid`);
  }

  const updated = (await prisma.application.update({
    where: {
      id: submission.id
    },
    data: {
      status: correspondingSubmissionStatus,
      reviewedBy: userId
    }
  })) as Application;

  return updated;
}
