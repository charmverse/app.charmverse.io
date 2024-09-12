import { log } from '@charmverse/core/log';
import cron from 'node-cron';

import app from './healthCheck/app';

log.info('Starting Scout Game cron jobs');

// Send push notifications to the app every day at 10am
// cron.schedule('0 10 * * *', sendPushNotificationsToSunyAppTask);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  log.info(`Server is up and running on port ${port} in "${process.env.NODE_ENV}" env`);
});
