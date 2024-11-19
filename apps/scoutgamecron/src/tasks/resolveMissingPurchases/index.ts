import { log } from '@charmverse/core/log';
import type Koa from 'koa';

import { findAndIndexMissingPurchases } from './findAndIndexMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  log.info('Resyncing builder NFT sales');

  await findAndIndexMissingPurchases();
  log.info(`Syncing complete`);
}
