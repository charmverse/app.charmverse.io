import { Application, ApplicationStatus } from '@prisma/client';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { prisma } from 'db';
import { ApplicationActionRequest, ReviewDecisionRequest, ReviewDecision } from '../interfaces';
import { getApplication } from '../getApplication';

const submissionStatusAfterDecision: Record<ReviewDecision, ApplicationStatus> = {
  approve: 'complete',
  reject: 'rejected'
};

/**
 * Accept, reject or request changes for the work
 * @returns
 */
export async function reviewSubmission ({ applicationOrApplicationId, userId, decision }: ReviewDecisionRequest): Promise<Application> {
  const application = await getApplication(typeof applicationOrApplicationId === 'string' ? applicationOrApplicationId : applicationOrApplicationId.id);

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationOrApplicationId} was not found`);
  }

  // Only the reviewer can accept the work
  if (application.bounty.reviewer !== userId) {
    throw new UnauthorisedActionError('Only the assigned reviewer can decide on submissions');
  }

  const correspondingSubmissionStatus = submissionStatusAfterDecision[decision];

  if (!correspondingSubmissionStatus) {
    throw new DataNotFoundError(`Decision ${decision} is invalid`);
  }

  const updated = await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: correspondingSubmissionStatus
    }
  }) as Application;

  return updated;
}
