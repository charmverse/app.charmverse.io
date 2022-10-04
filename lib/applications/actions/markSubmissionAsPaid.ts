import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, WrongStateError } from 'lib/utilities/errors';

import { getApplication } from '../getApplication';

export async function markSubmissionAsPaid (submissionId: string) {
  const submission = await getApplication(submissionId);

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${submissionId} was not found`);
  }

  if (submission.status !== 'complete') {
    throw new WrongStateError('Submissions must be completed for you to make payment');
  }

  return await prisma.application.update({
    where: {
      id: submission.id
    },
    data: {
      status: 'paid'
    }
  }) as Application;
}
