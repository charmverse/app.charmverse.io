import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { refreshPointStatsFromHistory } from '@packages/scoutgame/points/refreshPointStatsFromHistory';

const fids: number[] = [];

const description = `Friends of Scout Game`;

async function issuePoints({ points }: { points: number }) {
  for (const fid of fids) {
    log.info(`Issuing points to fid: ${fid}`);

    const scout = await prisma.scout.findFirstOrThrow({
      where: {
        farcasterId: fid
      },
      select: {
        id: true,
        pointsReceived: {
          where: {
            event: {
              description: {
                contains: description,
                mode: 'insensitive'
              }
            }
          }
        }
      }
    });

    if (scout.pointsReceived.length > 0) {
      log.info(`Points already issued to fid: ${fid}`);
      continue;
    }

    await prisma.$transaction(
      async (tx) => {
        await sendPointsForMiscEvent({
          builderId: scout.id,
          points,
          claimed: true,
          description: `Friends of Scout Game`,
          hideFromNotifications: true,
          season: currentSeason,
          week: getLastWeek(),
          tx
        });

        await refreshPointStatsFromHistory({ userIdOrPath: scout.id, tx });
      },
      { timeout: 15000 }
    );
  }
}
