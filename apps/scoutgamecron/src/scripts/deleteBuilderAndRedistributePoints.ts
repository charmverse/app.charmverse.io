import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';

async function deleteBuilderAndRedistributePoints({ builderPath }: { builderPath: string }) {
  const builder = await prisma.scout.findUnique({
    where: {
      path: builderPath
    }
  });

  if (!builder) {
    throw new Error(`Builder with path ${builderPath} not found`);
  }

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNft: {
        season: currentSeason,
        builder: {
          path: builderPath
        }
      }
    },
    select: {
      id: true,
      tokensPurchased: true,
      scout: {
        select: {
          id: true
        }
      }
    }
  });

  const nftPurchaseEventIds = nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.id);
  const nftPurchaseEventsRecord: Record<string, number> = {};
  nftPurchaseEvents.forEach((nftPurchaseEvent) => {
    if (!nftPurchaseEventsRecord[nftPurchaseEvent.scout.id]) {
      nftPurchaseEventsRecord[nftPurchaseEvent.scout.id] = 0;
    }
    nftPurchaseEventsRecord[nftPurchaseEvent.scout.id] += nftPurchaseEvent.tokensPurchased;
  });

  await prisma.$transaction(
    async (tx) => {
      await prisma.scout.delete({
        where: {
          path: builderPath
        }
      });
      await prisma.nFTPurchaseEvent.deleteMany({
        where: {
          id: {
            in: nftPurchaseEventIds
          }
        }
      });
      for (const [scoutId, tokensPurchased] of Object.entries(nftPurchaseEventsRecord)) {
        const points = tokensPurchased * 20;
        await sendPointsForMiscEvent({
          tx,
          builderId: scoutId,
          points,
          description: `You received a ${points} point gift from Scout Game`,
          claimed: true,
          earnedAs: 'scout'
        });
        await prisma.userSeasonStats.update({
          where: {
            userId_season: {
              userId: scoutId,
              season: currentSeason
            }
          },
          data: {
            nftsPurchased: {
              decrement: tokensPurchased
            }
          }
        });
      }
    },
    {
      timeout: 60000
    }
  );
}

deleteBuilderAndRedistributePoints({
  builderPath: 'path'
});
