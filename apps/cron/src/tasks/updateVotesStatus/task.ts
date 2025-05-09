import { log } from '@charmverse/core/log';
import { count } from '@packages/metrics';

import updateVoteStatus from './updateVoteStatus';

export async function task() {
  log.debug('Running update vote status cron job');

  try {
    const updateCount = await updateVoteStatus();

    log.info(`Updated ${updateCount} votes`);

    count('cron.vote-status.updated', updateCount);
  } catch (error: any) {
    log.error(`Error running vote status update: ${error.stack || error.message || error}`, { error });
  }
}
