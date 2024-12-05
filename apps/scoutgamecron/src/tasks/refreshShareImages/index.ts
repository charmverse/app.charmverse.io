import { log } from '@charmverse/core/log';
import type Koa from 'koa';

import { refreshShareImages } from './refreshShareImages';

export async function refreshShareImagesTask(ctx: Koa.Context) {
  log.info('Refreshing NFT congrats images for all builders');
  await refreshShareImages();
  log.info(`Syncing complete`);
}
