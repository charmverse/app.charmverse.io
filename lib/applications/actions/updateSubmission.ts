import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';

import { getApplication } from '../getApplication';
import type { SubmissionUpdateData } from '../interfaces';
import { submissionIsEditable } from '../shared';

export async function updateSubmission ({ submissionId, submissionContent }: SubmissionUpdateData): Promise<Application> {
  // Undefined is ok, but not null or empty string values
  const isEmpty = Object.values(submissionContent).indexOf(null as any) > -1 || (submissionContent.submission?.length ?? 1) < 1 || (typeof submissionContent.submissionNodes === 'string' && (submissionContent.submissionNodes?.length ?? 1) < 1);

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

  if (!submissionContent.walletAddress) {
    throw new MissingDataError('You must provide a wallet address in your submission');
  }

  return prisma.application.update({
    where: {
      id: submissionId
    },
    data: {
      status: existingSubmission.status === 'inProgress' ? 'review' : undefined,
      submission: submissionContent.submission,
      submissionNodes: typeof submissionContent.submissionNodes === 'object' ? JSON.stringify(submissionContent.submissionNodes) : submissionContent.submissionNodes,
      walletAddress: submissionContent.walletAddress
    }
  });
}
