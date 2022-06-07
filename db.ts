import { PrismaClient } from '@prisma/client';

// copied from https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices

declare global {
  // eslint-disable-next-line
  var prisma: PrismaClient | undefined;
}

export const prisma = global?.prisma
  || new PrismaClient({
  //  log: ['query']
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
