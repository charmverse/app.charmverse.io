
import log from 'lib/log';
import { gauge } from 'lib/metrics';
import { sendUserNotifications } from './sendNotifications';

export default async function task () {

  log.debug('Running notifications cron job');

  try {
    const notificationCount = await sendUserNotifications();

    log.info(`Sent ${notificationCount} notifications`);

    gauge('cron.user-notifications.sent', notificationCount);
  }
  catch (error: any) {
    log.error(`Error running notifications: ${error.stack || error.message || error}`, { error });
  }
}
