import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

async function migrateFarcasterUsername() {
  const scouts = await prisma.scout.findMany({
    where: {
      farcasterId: {
        not: null
      }
    },
    select: {
      id: true,
      path: true
    }
  });
  for (const scout of scouts) {
    await prisma.scout.update({
      where: { id: scout.id },
      data: {
        farcasterName: scout.path
      }
    });
    log.info(`Updated farcaster username for ${scout.path}`);
  }
}

migrateFarcasterUsername();
