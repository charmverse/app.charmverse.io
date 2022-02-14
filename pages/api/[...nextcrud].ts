import NextCrud, { PrismaAdapter } from '@premieroctet/next-crud';
import { prisma } from 'db';

const handler = NextCrud({
  adapter: new PrismaAdapter({
    prismaClient: prisma
  })
});

export default handler;
