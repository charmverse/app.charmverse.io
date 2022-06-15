import { NotificationType } from '@prisma/client';
import { prisma } from 'db';
import { MentionedTask } from './interfaces';

export type MarkMentionTask = Pick<MentionedTask, 'mentionId' | 'createdAt'>

export async function markMentionedTasks (mentions: MarkMentionTask[], userId: string) {
  const userNotifications = await prisma.userNotification.findMany({
    select: {
      taskId: true
    }
  });

  const taskIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const mentionsNotNotified = mentions.filter(mention => !taskIds.has(mention.mentionId));

  await prisma.userNotification.createMany({
    data: mentionsNotNotified.map(mention => ({
      taskId: mention.mentionId,
      type: 'mention' as NotificationType,
      userId,
      createdAt: new Date()
    }))
  });
}
