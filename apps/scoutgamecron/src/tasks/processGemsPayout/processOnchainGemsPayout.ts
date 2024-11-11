import { log } from '@charmverse/core/log';
import { currentSeason, getLastWeek } from '@packages/scoutgame/dates';
import { generateWeeklyClaims } from '@packages/scoutgame/protocol/generateWeeklyClaims';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

export async function processOnchainGemsPayout(
  ctx: Context,
  { season = currentSeason, now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const generatedClaims = await generateWeeklyClaims({ week });

  log.info(`Processed ${generatedClaims.totalBuilders} builders points payout`, {
    totalBuilders: generatedClaims.totalBuilders
  });
}
