import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://postgres:postgres@localhost:5432/charmversetest'
    }
  }
});
