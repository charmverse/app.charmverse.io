import { prisma } from '@charmverse/core';

import { refreshPaymentStatus } from 'lib/applications/actions/refreshPaymentStatus';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { TransactionCreationData } from './interface';

export async function createTransaction({
  applicationId,
  chainId,
  transactionId,
  safeTxHash
}: TransactionCreationData) {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
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
    await refreshPaymentStatus(applicationId);
  }

  return tx;
}
