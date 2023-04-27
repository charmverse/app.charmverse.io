import { prisma } from 'db';
import { refreshPaymentStatus } from 'lib/applications/actions/refreshPaymentStatus';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { TransactionCreationData } from './interface';

export async function createTransaction({
  applicationId,
  chainId,
  transactionId,
  isMultisig
}: TransactionCreationData & { isMultisig?: boolean }) {
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
      application: {
        connect: {
          id: applicationId
        }
      }
    }
  });

  if (isMultisig) {
    await refreshPaymentStatus(applicationId);
  }

  return tx;
}
