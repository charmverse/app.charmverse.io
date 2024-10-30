import { log } from '@charmverse/core/log';
import type Koa from 'koa';

import { resolveMissingPurchases } from './resolveMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  log.info('Resyncing builder NFT sales');
  await resolveMissingPurchases({ minutesAgoToNow: 5 });
  log.info(`Syncing complete`);
}
