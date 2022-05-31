
import { prisma } from 'db';
import { getPendingGnosisTasks } from 'lib/gnosis/gnosis.tasks';

export async function sendUserNotifications (): Promise<number> {

  const usersWithTasks = await getUsersWithTasks();

  return usersWithTasks.length;
}

export async function getUsersWithTasks () {

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
    console.log('tasks', tasks);
    return { user, tasks };
  }));
}
