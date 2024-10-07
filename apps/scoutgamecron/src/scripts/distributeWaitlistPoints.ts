import { log } from '@charmverse/core/log';
import { BuilderEventType, prisma } from "@charmverse/core/prisma-client";
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { ConnectWaitlistTier, getTier } from '@packages/scoutgame/waitlist/scoring/constants';

const waitlistTierPointsRecord: Record<ConnectWaitlistTier, number> = {
  legendary: 60,
  mythic: 30,
  epic: 20,
  rare: 15,
  common: 10
};


export async function distributeWaitlistPoints() {
  const waitlistRecords = await prisma.connectWaitlistSlot.findMany({
    select: {
      fid: true,
      username: true,
      githubLogin: true,
      percentile: true
    }
  })

  for (const record of waitlistRecords) {
    const scout = await prisma.scout.findFirst({
      where: {
        farcasterId: record.fid
      },
      select: {
        id: true
      }
    })

    if (scout) {
      const tier = getTier(record.percentile);
      const points = waitlistTierPointsRecord[tier] || 0;

      if (points) {
        await prisma.$transaction([
          prisma.scout.update({
            where: {
              id: scout.id
            },
            data: {
              currentBalance: {
                increment: points
              }
            }
          }),
          prisma.pointsReceipt.create({
            data: {
              value: points,
              claimedAt: new Date(),
              event: {
                create: {
                  season: currentSeason,
                  type: 'misc_event' as BuilderEventType,
                  week: getCurrentWeek(),
                  description: 'Received points for participating in pre-season week as a Builder',
                  builderId: scout.id,
                }
              },
              activities: {
                create: {
                  type: "points",
                  userId: scout.id,
                  recipientType: "builder"
                }
              }
            }
          })
        ])
      }

      log.info(`Successfully distributed ${points} points to ${record.username} (${record.fid})`)
    }
  }
}

distributeWaitlistPoints();