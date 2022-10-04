import type { NotificationType } from '@prisma/client';

import { prisma } from 'db';

export interface MarkTask {
  id: string;
  type: NotificationType;
}

export async function markTasks (tasks: MarkTask[], userId: string) {
  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId
    },
    select: {
      taskId: true
    }
  });

  const taskIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const tasksNotNotified = tasks.filter(task => !taskIds.has(task.id));

  if (tasksNotNotified.length !== 0) {
    await prisma.userNotification.createMany({
      data: tasksNotNotified.map(task => ({
        taskId: task.id,
        channel: 'webapp' as const,
        type: task.type,
        userId,
        createdAt: new Date()
      }))
    });
  }
}
