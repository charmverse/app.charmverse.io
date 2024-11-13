import { log } from '@charmverse/core/log';
import type Koa from 'koa';

import { refreshCongratsImages } from './refreshCongratsImages';

export async function nftCongratsImageTask(ctx: Koa.Context) {
  log.info('Refreshing NFT congrats images for all builders');
  await refreshCongratsImages();
  log.info(`Syncing complete`);
}
