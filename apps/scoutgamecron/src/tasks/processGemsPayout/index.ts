import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { getWeeklyPointsPoolAndBuilders } from '@packages/scoutgame/points/getWeeklyPointsPoolAndBuilders';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

import { sendGemsPayoutEmails } from '../../emails/sendGemsPayoutEmails/sendGemsPayoutEmails';

import { processScoutPointsPayout } from './processScoutPointsPayout';

export async function processGemsPayout(
  ctx: Context,
  { season = currentSeason, now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    scoutgameMintsLogger.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const existingPayoutCount = await prisma.builderEvent.count({
    where: {
      week,
      type: 'gems_payout'
    }
  });

  if (existingPayoutCount > 0) {
    scoutgameMintsLogger.info('Gems Payout: Payout already exists for this week, skipping');
    return;
  }

  const { normalisationFactor, topWeeklyBuilders, totalPoints, weeklyAllocatedPoints } =
    await getWeeklyPointsPoolAndBuilders({ week });

  scoutgameMintsLogger.debug(`Allocation: ${weeklyAllocatedPoints} -- Total points for week ${week}: ${totalPoints}`, {
    topWeeklyBuilders: topWeeklyBuilders.length,
    week,
    season,
    normalisationFactor,
    totalPoints,
    allocatedPoints: weeklyAllocatedPoints
  });

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      scoutgameMintsLogger.info(`Processing scout points payout for builder ${builder.id}`);
      await processScoutPointsPayout({
        builderId: builder.id,
        rank,
        gemsCollected,
        week,
        season,
        normalisationFactor,
        weeklyAllocatedPoints
      });
    } catch (error) {
      scoutgameMintsLogger.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  const emailsSent = await sendGemsPayoutEmails({ week });

  scoutgameMintsLogger.info(`Processed ${topWeeklyBuilders.length} builders points payout`, { emailsSent });
}
