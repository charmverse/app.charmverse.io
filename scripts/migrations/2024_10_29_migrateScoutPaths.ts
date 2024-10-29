import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

async function migrateScoutPaths() {
  const scouts = await prisma.scout.findMany({
    where: {
      path: null
    },
    select: {
      id: true,
      username: true
    }
  });
  for (const scout of scouts) {
    await prisma.scout.update({
      where: { id: scout.id },
      data: {
        path: scout.username
      }
    });
    log.info(`Updated path for ${scout.username}`);
  }
}

migrateScoutPaths();