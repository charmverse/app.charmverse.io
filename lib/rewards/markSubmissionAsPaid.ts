import { WrongStateError } from '@charmverse/core/errors';
import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { issueRewardCredentialsIfNecessary } from 'lib/credentials/issueRewardCredentialsIfNecessary';

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

  await issueRewardCredentialsIfNecessary({
    event: 'reward_submission_approved',
    rewardId: submission.bountyId,
    submissionId
  });

  return prisma.application.update({
    where: {
      id: submissionId
    },
    data: {
      status: 'paid'
    }
  });
}
