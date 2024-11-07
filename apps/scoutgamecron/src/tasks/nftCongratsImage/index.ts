import { log } from '@charmverse/core/log';
import { refreshCongratsImages } from '@packages/scoutgame/builders/refreshCongratsImages';
import type Koa from 'koa';

export async function nftCongratsImageTask(ctx: Koa.Context) {
  log.info('Refreshing NFT congrats images for all builders');
  await refreshCongratsImages();
  log.info(`Syncing complete`);
}
