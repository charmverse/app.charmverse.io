import { log } from '@charmverse/core/log';
import type Koa from 'koa';
import { DateTime } from 'luxon';

import { updateBuilderCardActivity } from './updateBuilderCardActivity';

export async function updateAllBuilderCardActivities(
  ctx: Koa.Context,
  { date = DateTime.now() }: { date?: DateTime } = {}
) {
  log.info('Updating builder card activities');
  const updatedBuilders = await updateBuilderCardActivity(date.minus({ days: 1 }));
  log.info(`Updated ${updatedBuilders} builder card activities`);
}
