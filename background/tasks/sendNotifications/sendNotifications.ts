import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotifications } from 'lib/mailer/emails/templates/PendingTasksTemplate';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getDiscussionNotifications } from 'lib/notifications/getDiscussionNotifications';
import { getPostNotifications } from 'lib/notifications/getPostNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';
import { isUUID } from 'lib/utilities/strings';

const notificationTaskLimiter = RateLimit(100);

export async function sendUserNotifications(): Promise<number> {
  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.info('Debug: send notification to user', {
      userId: notification.user.id,
      tasks: notification.totalNotifications
    });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

export async function getNotifications(): Promise<PendingNotifications[]> {
  const userWithNotificationState = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: [{ email: { not: null } }, { email: { not: '' } }, { emailNotifications: true }]
    },
    // select only the fields that are needed
    select: {
      notificationState: true,
      id: true,
      username: true,
      email: true
    }
  });

  // filter out users that have snoozed notifications
  const notificationActivatedUsers = userWithNotificationState.filter((user) => {
    const snoozedUntil = user.notificationState?.snoozedUntil;
    return !snoozedUntil || snoozedUntil > new Date();
  });

  const notifications: PendingNotifications[] = [];

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  for (const user of notificationActivatedUsers) {
    // Since we will be calling permissions API, we want to ensure we don't flood it with requests
    await notificationTaskLimiter();

    const [discussionNotifications, voteNotifications, bountyNotifications, forumNotifications, proposalNotifications] =
      await Promise.all([
        getDiscussionNotifications(user.id),
        getVoteNotifications(user.id),
        getBountyNotifications(user.id),
        getPostNotifications(user.id),
        getProposalNotifications(user.id)
      ]);

    const totalNotifications =
      discussionNotifications.unmarked.length +
      voteNotifications.unmarked.length +
      proposalNotifications.unmarked.length +
      bountyNotifications.unmarked.length +
      forumNotifications.unmarked.length;

    log.debug('Found tasks for notification', {
      notSent: totalNotifications
    });

    notifications.push({
      user: user as PendingNotifications['user'],
      totalNotifications,
      discussionNotifications: discussionNotifications.unmarked,
      voteNotifications: voteNotifications.unmarked,
      proposalNotifications: proposalNotifications.unmarked,
      bountyNotifications: bountyNotifications.unmarked,
      forumNotifications: forumNotifications.unmarked
    });
  }

  return notifications.filter((notification) => notification.totalNotifications > 0);
}

async function sendNotification(notification: PendingNotifications) {
  const notificationIds = [
    ...notification.proposalNotifications.map((proposalTask) => proposalTask.taskId),
    ...notification.discussionNotifications.map((discussionTask) => discussionTask.taskId),
    ...notification.voteNotifications.map((voteTask) => voteTask.taskId),
    ...notification.bountyNotifications.map((bountyTask) => bountyTask.taskId),
    ...notification.forumNotifications.map((forumTask) => forumTask.taskId)
  ].filter((nid) => isUUID(nid));

  try {
    await prisma.$transaction([
      prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: notificationIds
          }
        },
        data: {
          seenAt: new Date(),
          channel: 'email'
        }
      })
    ]);
  } catch (error) {
    log.error(`Error trying to save notification for user`, {
      userId: notification.user.id,
      error,
      forumTaskIds: notification.forumNotifications.map((forumTask) => forumTask.taskId),
      proposalTaskIds: notification.proposalNotifications.map((proposalTask) => proposalTask.taskId),
      voteTaskIds: notification.voteNotifications.map((voteTask) => voteTask.taskId),
      discussionTaskIds: notification.discussionNotifications.map((discussionTask) => discussionTask.taskId),
      bountyTaskIds: notification.bountyNotifications.map((bountyTask) => bountyTask.taskId)
    });
    return undefined;
  }

  const template = emails.getPendingTasksEmail(notification);
  const result = await mailer.sendEmail({
    to: {
      displayName: notification.user.username,
      email: notification.user.email
    },
    subject: template.subject,
    html: template.html
  });

  return result;
}
