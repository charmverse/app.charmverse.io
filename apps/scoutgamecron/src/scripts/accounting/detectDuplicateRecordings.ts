import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';

async function detectDuplicateRecordings() {
  const duplicatePurchaseEvents = await prisma.nFTPurchaseEvent
    .groupBy({
      by: 'txHash',
      _count: true
    })
    .then((events) => events.filter((ev) => ev._count > 1));

  if (!duplicatePurchaseEvents.length) {
    log.info(`No duplicate events found`);
    return [];
  }

  const sourceEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      txHash: {
        in: duplicatePurchaseEvents.map((ev) => ev.txHash),
        mode: 'insensitive'
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      createdAt: true,
      scoutId: true,
      paidInPoints: true,
      pointsValue: true,
      txHash: true,
      builderNft: {
        select: {
          tokenId: true
        }
      }
    }
  });

  const eventsWithSource = duplicatePurchaseEvents.map((ev) => ({
    ...ev,
    sourceEvents: sourceEvents.filter((source) => source.txHash.toLowerCase() === ev.txHash.toLowerCase())
  }));

  log.info(`Detected ${eventsWithSource.length} duplicated tx hashes `);

  return eventsWithSource;
}
