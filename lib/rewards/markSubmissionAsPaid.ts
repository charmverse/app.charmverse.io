import { WrongStateError } from '@charmverse/core/errors';
import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function markSubmissionAsPaid(submissionId: string): Promise<Application> {
  const submission = await prisma.application.findUniqueOrThrow({
    where: {
      id: submissionId
    },
    select: {
      status: true,
      bountyId: true
    }
  });

  if (submission.status !== 'complete') {
    throw new WrongStateError(`Submission must be complete to be marked as paid`);
  }

  return prisma.application.update({
    where: {
      id: submissionId
    },
    data: {
      status: 'paid'
    }
  });
}
