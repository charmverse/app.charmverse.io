import { log } from '@charmverse/core/log';

import worker from './worker';

log.info('Starting Scout Game worker');

// Send push notifications to the app every day at 10am
// cron.schedule('0 10 * * *', sendPushNotificationsToSunyAppTask);

const port = process.env.PORT || 4000;

worker.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
