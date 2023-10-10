// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

// Script 2 - Migrate spaces
async function migrateSpaces() {
  const r = await prisma.space.updateMany({
    where: {
      notifyNewProposals: null
    },
    data: {
      notificationToggles: {
        proposals__start_discussion: false,
        proposals__vote: false
      }
    }
  });
}

migrateSpaces().then(() => console.log('done'));
