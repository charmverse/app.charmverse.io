import type { NotificationType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { isUUID } from 'lib/utilities/strings';

export interface MarkTask {
  id: string;
  type: NotificationType;
}

export async function markTasks(tasks: MarkTask[], userId: string) {
  const taskIds = tasks.map((userNotification) => userNotification.id);

  await prisma.userNotificationMetadata.updateMany({
    where: {
      id: {
        in: taskIds.filter((taskId) => isUUID(taskId))
      }
    },
    data: {
      seenAt: new Date(),
      channel: 'webapp'
    }
  });
}
