import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { syncSummonSpaceRoles } from '@packages/lib/summon/syncSummonSpaceRoles';

export async function syncSummonSpacesRoles() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true
    },
    where: {
      xpsEngineId: {
        not: null
      }
    }
  });

  const spaceIds = spaces.map((space) => space.id);

  log.debug('Number of spaces with a Summon tenant ID', spaceIds.length);

  for (const spaceId of spaceIds) {
    try {
      await syncSummonSpaceRoles({ spaceId });
    } catch (err: any) {
      log.error(`Error syncing space role for space ${spaceId}: ${err.stack || err.message || err}`, { err, spaceId });
    }
  }
}
