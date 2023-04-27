import { ApplicationStatus } from '@prisma/client';

import { prisma } from 'db';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { getSafeTxStatus } from 'lib/gnosis/getSafeTxStatus';
import { DataNotFoundError } from 'lib/utilities/errors';

export async function refreshPaymentStatus(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
    },
    include: {
      transactions: true
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} was not found`);
  }

  if (
    (application.status !== ApplicationStatus.complete && application.status !== ApplicationStatus.processing) ||
    application.transactions.length === 0
  ) {
    return { application, updated: false };
  }

  const multisigTxStatuses = application.transactions.map((tx) =>
    getSafeTxStatus({ txHash: tx.transactionId, chainId: Number(tx.chainId) })
  );

  try {
    const statuses = await Promise.all(multisigTxStatuses);
    const updatedStatus = getApplicationStatus(statuses);

    if (updatedStatus !== application.status) {
      const updatedApplication = await prisma.application.update({
        where: {
          id: application.id
        },
        data: {
          status: updatedStatus
        }
      });

      await rollupBountyStatus(updatedApplication.bountyId);

      return { application: updatedApplication, updated: true };
    }

    return { application, updated: false };
  } catch (e) {
    return { application, updated: false };
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
