import type { Application, ApplicationStatus } from '@prisma/client';

import { prisma } from 'db';
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
export async function reviewSubmission ({ submissionId, decision, userId }: SubmissionReview): Promise<Application> {
  const submission = await getApplication(submissionId);

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${submissionId} was not found`);
  }

  if (submission.createdBy === userId) {
    throw new UndesirableOperationError('You cannot review your own submission');
  }

  if (submission.status !== 'review' && decision === 'approve') {
    throw new WrongStateError('Submissions must be in review for you to approve them');
  }

  const correspondingSubmissionStatus = submissionStatusAfterDecision[decision];

  if (!correspondingSubmissionStatus) {
    throw new InvalidInputError(`Decision ${decision} is invalid`);
  }

  const updated = await prisma.application.update({
    where: {
      id: submission.id
    },
    data: {
      status: correspondingSubmissionStatus,
      reviewedBy: userId
    }
  }) as Application;

  return updated;
}
