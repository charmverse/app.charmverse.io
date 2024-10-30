import { log } from '@charmverse/core/log';
import type Koa from 'koa';

import { resolveMissingPurchases } from './resolveMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  log.info('Resyncing builder NFT sales');
  // This task is run every 5 minutes. Adding some padding so we don't miss any transactions
  await resolveMissingPurchases({ minutesAgoToNow: 7 });
  log.info(`Syncing complete`);
}
