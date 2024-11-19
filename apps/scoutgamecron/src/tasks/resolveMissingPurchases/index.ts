import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import type Koa from 'koa';

import { findAndIndexMissingPurchases } from './findAndIndexMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  scoutgameMintsLogger.info('Resyncing builder NFT sales');

  await findAndIndexMissingPurchases();
  scoutgameMintsLogger.info(`Syncing complete`);
}
