import { Application } from '@prisma/client';
import { DataNotFoundError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { getApplication } from '../getApplication';
import { SubmissionContent, SubmissionUpdateData } from '../interfaces';
import { submissionIsEditable } from '../shared';

export async function updateSubmission ({ submissionId, submissionContent }: SubmissionUpdateData): Promise<Application> {
  // Undefined is ok, but not null or string values
  const isEmpty = Object.values(submissionContent).indexOf(null) > -1 || (submissionContent.submission?.length ?? 1) < 1 || (typeof submissionContent.submissionNodes === 'string' && (submissionContent.submissionNodes?.length ?? 1) < -1);

  if (isEmpty) {
    throw new MissingDataError('You cannot provide an empty submission');
  }

  const existingSubmission = await getApplication(submissionId);

  if (!existingSubmission) {
    throw new DataNotFoundError(`Submission with id ${submissionId} not found`);
  }

  if (!submissionIsEditable({ bounty: existingSubmission.bounty, submission: existingSubmission })) {
    throw new UnauthorisedActionError();
  }

  return prisma.application.update({
    where: {
      id: submissionId
    },
    data: {
      submission: submissionContent.submission,
      submissionNodes: typeof submissionContent.submissionNodes === 'object' ? JSON.stringify(submissionContent.submissionNodes) : '',
      walletAddress: submissionContent.walletAddress
    }
  });
}
