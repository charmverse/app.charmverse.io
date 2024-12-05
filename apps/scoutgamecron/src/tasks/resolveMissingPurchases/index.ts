import { BuilderNftType } from '@charmverse/core/prisma-client';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import type Koa from 'koa';

import { findAndIndexMissingPurchases } from './findAndIndexMissingPurchases';

export async function resolveMissingPurchasesTask(ctx: Koa.Context) {
  scoutgameMintsLogger.info('Resyncing builder NFT sales');

  await findAndIndexMissingPurchases({ nftType: BuilderNftType.default });
  await findAndIndexMissingPurchases({ nftType: BuilderNftType.season_1_starter_pack });
  scoutgameMintsLogger.info(`Syncing complete`);
}
