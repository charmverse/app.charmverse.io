/* eslint-disable no-extend-native */
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// @ts-ignore - add support for JSON for BigInt (used in telegramuser) - https://github.com/GoogleChromeLabs/jsbi/issues/30
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// @ts-expect-error - dont mutate global for Node.js
export const prisma: PrismaClient = global.prisma || new PrismaClient({});

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error
  global.prisma = prisma;
}

export type TransactionClient = PrismaClient | Prisma.TransactionClient;

// Pass a transaction from outer scope of function calling this
export type Transaction = { tx: TransactionClient };
export type OptionalTransaction = Partial<Transaction>;
