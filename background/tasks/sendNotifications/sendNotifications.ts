
import { prisma } from 'db';
import * as emails from 'lib/emails';
import { PendingTasksProps } from 'lib/emails/templates/PendingTasks';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';
import log from 'lib/log';
import * as mailer from 'lib/mailer';

export async function sendUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', { userId: notification.user.id, tasks: notification.tasks.length });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

export async function getNotifications (): Promise<PendingTasksProps[]> {

  const usersWithSafes = await prisma.user.findMany({
    where: {
      gnosisSafes: { some: {} },
      AND: [
        { email: { not: null } },
        { email: { not: '' } }
      ]
    },
    include: {
      gnosisSafes: true,
      notificationState: true
    }
  });

  // filter out users that have snoozed notifications
  const activeUsersWithSafes = usersWithSafes.filter(user => {
    const snoozedUntil = user.notificationState?.snoozedUntil;
    return !snoozedUntil || snoozedUntil > new Date();
  }) as typeof usersWithSafes;

  const notifications = await Promise.all(activeUsersWithSafes.map(async user => {
    const tasks = await getPendingGnosisTasks(user.id);
    // myAction is undefined if we are waiting for others to sign
    const myTasks = tasks.filter(task => Boolean(task.tasks[0].transactions[0].myAction));
    return {
      user: user as PendingTasksProps['user'],
      tasks: myTasks
    };
  }));

  return notifications.filter(notification => notification.tasks.length > 0);
}

async function sendNotification (notification: PendingTasksProps) {
  const template = emails.getPendingTasksEmail(notification);
  const { html, subject } = template;
  return mailer.sendEmail({
    to: {
      displayName: notification.user.username,
      email: notification.user.email
    },
    subject,
    html
  });
}
