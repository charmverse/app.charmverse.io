

import log from 'lib/log';
import { number } from 'yup';
import { getNotifications } from '../background/tasks/sendNotifications/sendNotifications';

export async function readUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: notification to user', {
      userId: notification.user.id,
      gnosis: notification.gnosisSafeTasks.length,
      mentions: notification.mentionedTasks.length,
      votes: notification.voteTasks.length,
      proposals: notification.proposalTasks.length
    });
  }

  return notificationsToSend.length;
}

log.info('Retrieving notifications to debug **This will not send emails**')

readUserNotifications()
  .then((count) => {
    log.info('Notifications to send:', count);
    process.exit();
  })
  .catch((error) => {
    log.error('Error reading notifications', { error });
    process.exit(1);
  });