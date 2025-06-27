import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function deleteArchivalBlockCounts(): Promise<number> {
  const { count } = await prisma.blockCount.deleteMany({
    where: {
      // older than 7 days
      createdAt: {
        lt: new Date(Date.now() - WEEK_IN_MS)
      }
    }
  });

  log.info('Deleted block count records older than 7 days', { count });

  return count;
}
