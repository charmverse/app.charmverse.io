
import log from 'lib/log';
import { gauge } from 'lib/metrics';
import updateVoteStatus from './updateVoteStatus';

export default async function task () {

  log.debug('Running update vote status cron job');

  try {
    const updateCount = await updateVoteStatus();

    log.info(`Updated ${updateCount} votes`);

    gauge('cron.vote-status.updated', updateCount);
  }
  catch (error: any) {
    log.error(`Error running vote status update: ${error.stack || error.message || error}`, { error });
  }
}
