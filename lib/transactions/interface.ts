import type { Transaction } from '@charmverse/core/prisma';

export type TransactionCreationData = Pick<Transaction, 'transactionId' | 'chainId'> & {
  applicationId: string;
  safeTxHash?: string;
  userId?: string;
};
