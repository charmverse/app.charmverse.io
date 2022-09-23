

import log from 'lib/log';
import { getNotifications } from '../background/tasks/sendNotifications/sendNotifications';

export async function readUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: notification to user', { userId: notification.user.id, tasks: notification.totalTasks });
  }

  return notificationsToSend.length;
}

log.info('Reading notifications **This will not send emails**')

readUserNotifications()
  .then((count) => {
    log.info('Notifications to send:', count);
    process.exit();
  })
  .catch((error) => {
    log.error('Error reading notifications', { error });
    process.exit(1);
  });