import { Application } from '@prisma/client';
import { DataNotFoundError, MissingDataError, UnauthorisedActionError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { getApplication } from '../getApplication';
import { SubmissionContent, SubmissionUpdateData } from '../interfaces';
import { submissionIsEditable } from '../shared';

export async function updateSubmission ({ submissionId, submissionContent }: SubmissionUpdateData): Promise<Application> {
  const isEmpty = !submissionContent.submission || submissionContent.submission.length < 1 || !submissionContent.submissionNodes;

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
      submissionNodes: submissionContent.submissionNodes
    }
  });
}
