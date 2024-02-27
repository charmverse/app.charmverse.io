import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { refreshPaymentStatus } from 'lib/rewards/refreshPaymentStatus';
import { DataNotFoundError } from 'lib/utils/errors';

import type { TransactionCreationData } from './interface';

export async function createTransaction({
  applicationId,
  chainId,
  transactionId,
  safeTxHash,
  userId
}: TransactionCreationData) {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
    },
    include: {
      bounty: true
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

  const tx = await prisma.transaction.create({
    data: {
      chainId,
      transactionId,
      safeTxHash,
      application: {
        connect: {
          id: applicationId
        }
      }
    }
  });

  // multisig tx
  if (safeTxHash) {
    await refreshPaymentStatus({ applicationId });
  }

  trackUserAction('bounty_paid', {
    walletType: safeTxHash ? 'Gnosis Safe' : 'Individual Wallet',
    resourceId: application.bountyId,
    rewardToken: application.bounty?.rewardToken,
    rewardAmount: application.bounty?.rewardAmount,
    spaceId: application.bounty?.spaceId,
    userId: userId || ''
  });

  return tx;
}
