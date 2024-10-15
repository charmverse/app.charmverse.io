import { log } from "@charmverse/core/log";
import { prisma } from "@charmverse/core/prisma-client";
import { currentSeason, getLastWeek } from "@packages/scoutgame/dates";
import {sendPoints} from '@packages/scoutgame/points/sendPoints'
import {refreshPointStatsFromHistory} from '@packages/scoutgame/points/refreshPointStatsFromHistory'

const fids: number[] = [
  // Enter FIDs here
];

async function issuePoints({points}: {points: number}) {
  for (const fid of fids) {
    log.info(`Issuing points to fid: ${fid}`);

    const scout = await prisma.scout.findFirstOrThrow({
      where: {
        farcasterId: fid
      }
    });

    await prisma.$transaction(async (tx) => {
      await sendPoints({
        builderId: fid.toString(),
        points,
        claimed: true,
        description: `Friends of Scout Game`,
        hideFromNotifications: true,
        season: currentSeason,
        week: getLastWeek(),
        tx
      });

      await refreshPointStatsFromHistory({ userIdOrUsername: scout.id, tx });
    });
  }
}