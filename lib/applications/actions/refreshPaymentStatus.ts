import { ApplicationStatus } from '@prisma/client';

import { prisma } from 'db';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { getSafeTxStatus } from 'lib/gnosis/getSafeTxStatus';
import { DataNotFoundError } from 'lib/utilities/errors';

export async function refreshPaymentStatus(applicationId: string) {
  const submission = await prisma.application.findUnique({
    where: {
      id: applicationId
    },
    include: {
      transactions: true
    }
  });

  if (!submission) {
    throw new DataNotFoundError(`Application with id ${applicationId} was not found`);
  }

  if (
    (submission.status !== ApplicationStatus.complete && submission.status !== ApplicationStatus.processing) ||
    submission.transactions.length === 0
  ) {
    return submission;
  }

  const multisigTxStatuses = submission.transactions.map((tx) =>
    getSafeTxStatus({ txHash: tx.transactionId, chainId: Number(tx.chainId) })
  );

  try {
    const statuses = await Promise.all(multisigTxStatuses);
    const updatedStatus = getApplicationStatus(statuses);

    if (updatedStatus !== submission.status) {
      const updatedApplication = await prisma.application.update({
        where: {
          id: submission.id
        },
        data: {
          status: updatedStatus
        }
      });

      await rollupBountyStatus(updatedApplication.bountyId);

      return updatedApplication;
    }

    return submission;
  } catch (e) {
    return submission;
  }
}

function getApplicationStatus(statuses: (ApplicationStatus | null)[]) {
  if (statuses.some((status) => status === ApplicationStatus.paid)) {
    return ApplicationStatus.paid;
  }

  if (statuses.some((status) => status === ApplicationStatus.cancelled)) {
    return ApplicationStatus.cancelled;
  }

  return ApplicationStatus.processing;
}
