import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line
  var globalPrisma: PrismaClient;
}

// eslint-disable-next-line import/no-mutable-exports
let prisma: PrismaClient;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
}
else {
  if (!global.globalPrisma) {
    global.globalPrisma = new PrismaClient();
  }
  prisma = global.globalPrisma;
}
export { prisma };
