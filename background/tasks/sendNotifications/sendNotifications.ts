
import { prisma } from 'db';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';
import log from 'lib/log';

export async function sendUserNotifications (): Promise<number> {

  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', { userId: notification.user.id, tasks: notification.tasks.length });
  }

  return notificationsToSend.length;
}

export async function getNotifications () {

  const usersWithSafes = await prisma.user.findMany({
    where: {
      gnosisSafes: { some: {} }
    },
    include: {
      gnosisSafes: true,
      gnosisSafeState: true
    }
  });

  // filter out users that have snoozed notifications
  const activeUsersWithSafes = usersWithSafes.filter(user => {
    const snoozedUntil = user.gnosisSafeState?.transactionsSnoozedFor;
    return !snoozedUntil || snoozedUntil > new Date();
  });

  return Promise.all(activeUsersWithSafes.map(async user => {
    const tasks = await getPendingGnosisTasks(user.id);
    return { user, tasks };
  }));
}
