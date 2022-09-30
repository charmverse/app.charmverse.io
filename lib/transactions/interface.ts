import type { Transaction } from '@prisma/client';

export type TransactionCreationData = Pick<Transaction, 'transactionId' | 'chainId'> & { applicationId: string }
