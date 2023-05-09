import { prisma } from '@charmverse/core';
import type { Transaction } from '@charmverse/core/prisma';
import { ApplicationStatus } from '@charmverse/core/prisma';

import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import type { SafeTxStatusDetails } from 'lib/gnosis/getSafeTxStatus';
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
    getSafeTxStatus({ safeTxHash: tx.transactionId, chainId: Number(tx.chainId) })
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

      await updateTransactions({ transactions: application.transactions, statuses });
      await rollupBountyStatus(updatedApplication.bountyId);

      return { application: updatedApplication, updated: true };
    }

    return { application, updated: false };
  } catch (e) {
    return { application, updated: false };
  }
}

function getApplicationStatus(statuses: (SafeTxStatusDetails | null)[]) {
  if (statuses.some((details) => details?.status === ApplicationStatus.paid)) {
    return ApplicationStatus.paid;
  }

  if (statuses.some((details) => details?.status === ApplicationStatus.cancelled)) {
    return ApplicationStatus.cancelled;
  }

  return ApplicationStatus.processing;
}

async function updateTransactions({
  transactions,
  statuses
}: {
  transactions: Transaction[];
  statuses: (SafeTxStatusDetails | null)[];
}) {
  const transactionUpdates = transactions
    .map((tx, index) => {
      const details = statuses[index];

      if (!details || !details.chainTxHash || details.chainTxHash === tx.transactionId) {
        return null;
      }

      // update tx hash only when transaction finished
      if (details.status !== ApplicationStatus.cancelled && details.status !== ApplicationStatus.paid) {
        return null;
      }

      return { id: tx.id, transactionId: details.chainTxHash };
    })
    .filter((x): x is { id: string; transactionId: string } => x !== null);

  return prisma.$transaction(
    transactionUpdates.map(({ id, transactionId }) => {
      return prisma.transaction.update({
        where: {
          id
        },
        data: {
          transactionId
        }
      });
    })
  );
}
