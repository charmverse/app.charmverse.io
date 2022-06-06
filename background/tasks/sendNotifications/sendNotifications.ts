
import { prisma } from 'db';
import * as emails from 'lib/emails';
import type { PendingTasksProps } from 'lib/emails/templates/PendingTasks';
import { getPendingGnosisTasks, GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
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

// note: the email only notifies the first task of each safe
const getTaskId = (task: GnosisSafeTasks) => task.tasks[0].transactions[0].id;

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

    const sentTasks = await prisma.userNotification.findMany({
      where: {
        taskId: {
          in: tasks.map(getTaskId)
        }
      }
    });

    const tasksNotSent = tasks.filter(task => !sentTasks.some(t => t.taskId === getTaskId(task)));
    const myTasks = tasksNotSent.filter(task => Boolean(task.tasks[0].transactions[0].myAction));

    log.debug('Found tasks for notification', {
      notSent: tasksNotSent.length,
      tasks: tasks.length,
      myTask: myTasks.length
    });

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
  const result = await mailer.sendEmail({
    to: {
      displayName: notification.user.username,
      email: notification.user.email
    },
    subject,
    html
  });

  // remember that we sent these tasks
  await prisma.$transaction(notification.tasks.map(task => prisma.userNotification.create({
    data: {
      userId: notification.user.id,
      taskId: getTaskId(task),
      type: 'multisig'
    }
  })));

  return result;
}
