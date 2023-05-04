import type { Transaction } from '@charmverse/core/dist/prisma';

export type TransactionCreationData = Pick<Transaction, 'transactionId' | 'chainId'> & { applicationId: string };
