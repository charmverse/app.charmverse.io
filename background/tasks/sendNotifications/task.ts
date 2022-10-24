
import log from 'lib/log';
import { count } from 'lib/metrics';

import { sendUserNotifications } from './sendNotifications';

export async function task () {

  log.debug('Running notifications cron job');

  try {
    const notificationCount = await sendUserNotifications();

    log.info(`Sent ${notificationCount} notifications`);

    count('cron.user-notifications.sent', notificationCount);
  }
  catch (error: any) {
    log.error(`Error running notifications: ${error.stack || error.message || error}`, { error });
  }
}
