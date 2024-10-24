import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { weeklyRewardableBuilders } from '@packages/scoutgame/builderNfts/constants';
import { currentSeason, getLastWeek, weeklyAllocatedPoints } from '@packages/scoutgame/dates';
import { getBuildersLeaderboard } from '@packages/scoutgame/getBuildersLeaderboard';
import { getPointsCountForWeekWithNormalisation } from '@packages/scoutgame/points/getPointsCountForWeekWithNormalisation';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

import { processScoutPointsPayout } from './processScoutPointsPayout';
import { sendGemsPayoutEmails } from './sendGemsPayoutEmails/sendGemsPayoutEmails';

export async function processGemsPayout(
  ctx: Context,
  { season = currentSeason, now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const existingPayoutCount = await prisma.builderEvent.count({
    where: {
      week,
      type: 'gems_payout'
    }
  });

  if (existingPayoutCount > 0) {
    log.info('Gems Payout: Payout already exists for this week, skipping');
    return;
  }

  const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week });

  const { normalisationFactor, totalPoints } = await getPointsCountForWeekWithNormalisation({ week });

  log.debug(`Allocation: ${weeklyAllocatedPoints} -- Total points for week ${week}: ${totalPoints}`, {
    topWeeklyBuilders: topWeeklyBuilders.length,
    week,
    season,
    normalisationFactor,
    totalPoints,
    allocatedPoints: weeklyAllocatedPoints
  });

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      log.info(`Processing scout points payout for builder ${builder.id}`);
      await processScoutPointsPayout({
        builderId: builder.id,
        rank,
        gemsCollected,
        week,
        season,
        normalisationFactor
      });
    } catch (error) {
      log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  const emailsSent = await sendGemsPayoutEmails({ week });

  log.info(`Processed ${topWeeklyBuilders.length} builders points payout`, { emailsSent });
}
