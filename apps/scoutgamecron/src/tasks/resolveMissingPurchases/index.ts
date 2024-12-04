import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import type Koa from 'koa';

import { findAndIndexMissingPurchases, findAndIndexMissingStarterPackPurchases } from './findAndIndexMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  scoutgameMintsLogger.info('Resyncing builder NFT sales');

  await findAndIndexMissingPurchases();
  await findAndIndexMissingStarterPackPurchases();
  scoutgameMintsLogger.info(`Syncing complete`);
}
