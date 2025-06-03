import type { Transaction } from '@charmverse/core/prisma';
import { ApplicationStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { SafeTxStatusDetails } from '@packages/lib/gnosis/getSafeTxStatus';
import { getSafeTxStatus } from '@packages/lib/gnosis/getSafeTxStatus';
import { rollupRewardStatus } from '@packages/lib/rewards/rollupRewardStatus';
import { DataNotFoundError } from '@packages/utils/errors';

export async function refreshPaymentStatus({ applicationId }: { applicationId: string }) {
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
    // is safeTxHash is not present, use transactionId as fallback and it will get filled
    getSafeTxStatus({ safeTxHash: tx.safeTxHash || tx.transactionId, chainId: Number(tx.chainId) })
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
      await rollupRewardStatus({
        rewardId: updatedApplication.bountyId
      });

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

      if (
        !details ||
        !details.chainTxHash ||
        (details.chainTxHash === tx.transactionId && details.safeTxHash === tx.safeTxHash)
      ) {
        return null;
      }

      return { id: tx.id, transactionId: details.chainTxHash, safeTxHash: details.safeTxHash };
    })
    .filter((x): x is { id: string; transactionId: string; safeTxHash: string } => x !== null);

  return prisma.$transaction(
    transactionUpdates.map(({ id, transactionId, safeTxHash }) => {
      return prisma.transaction.update({
        where: {
          id
        },
        data: {
          transactionId,
          safeTxHash
        }
      });
    })
  );
}
