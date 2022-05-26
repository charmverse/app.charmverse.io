import { Transaction } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';

export type TransactionCreationData = Pick<Transaction, 'transactionId' | 'chainId'> & {applicationId: string}

export async function createTransaction ({ applicationId, chainId, transactionId }: TransactionCreationData) {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

  return prisma.transaction.create({
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
}
