import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma
  || new PrismaClient({
    //    log: ['query']
  });

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  global.prisma = prisma;
}
