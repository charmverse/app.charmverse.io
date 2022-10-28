

import log from 'lib/log';
import { number } from 'yup';
import { getNotifications } from '../background/tasks/sendNotifications/sendNotifications';

export async function readUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info(`\nNotifications to user: ${notification.user.email}`
      + `\n--------------------------------------------------------------`
      + `\ngnosis: ${notification.gnosisSafeTasks.length}`
      + `\ndiscussions: ${notification.discussionTasks.length}`
      + `\nvotes: ${notification.voteTasks.length}`
      + `\nproposals: ${notification.proposalTasks.length}`
      + `\n  ${notification.proposalTasks.map(task =>
          `${task.pageTitle} (${task.spaceName})`).join('\n  ')
        }`
    );
  }

  return notificationsToSend.length;
}

log.info('Retrieving notifications to debug **This will not send emails**')

readUserNotifications()
  .then(() => {
    process.exit();
  })
  .catch((error) => {
    log.error('Error reading notifications', { error });
    process.exit(1);
  });