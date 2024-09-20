// init app instrumentation
import './datadog';

import { log } from '@charmverse/core/log';

import worker from './worker';

log.info('Starting Scout Game worker');

// Send push notifications to the app every day at 10am
// cron.schedule('0 10 * * *', sendPushNotificationsToSunyAppTask);

const port = process.env.PORT || 4000;

const server = worker.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});

async function cleanup() {
  log.info('[server] Closing server...');
  await server.close();
  log.info('[server] Exiting process...');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
