import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotifications } from 'lib/mailer/emails/templates/PendingTasksTemplate';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getCardNotifications } from 'lib/notifications/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/getDocumentNotifications';
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
      tasks: notification.totalUnreadNotifications
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

    const [
      documentNotifications,
      cardNotifications,
      voteNotifications,
      bountyNotifications,
      forumNotifications,
      proposalNotifications
    ] = await Promise.all([
      getDocumentNotifications(user.id),
      getCardNotifications(user.id),
      getVoteNotifications(user.id),
      getBountyNotifications(user.id),
      getPostNotifications(user.id),
      getProposalNotifications(user.id)
    ]);

    const unreadDocumentNotifications = documentNotifications.filter((notification) => !notification.read);
    const unreadCardNotifications = cardNotifications.filter((notification) => !notification.read);
    const unreadVoteNotifications = voteNotifications.filter((notification) => !notification.read);
    const unreadBountyNotifications = bountyNotifications.filter((notification) => !notification.read);
    const unreadForumNotifications = forumNotifications.filter((notification) => !notification.read);
    const unreadProposalNotifications = proposalNotifications.filter((notification) => !notification.read);

    const totalUnreadNotifications =
      unreadDocumentNotifications.length +
      unreadCardNotifications.length +
      unreadVoteNotifications.length +
      unreadBountyNotifications.length +
      unreadForumNotifications.length +
      unreadProposalNotifications.length;

    log.debug('Found tasks for notification', {
      notSent: totalUnreadNotifications
    });

    notifications.push({
      user: user as PendingNotifications['user'],
      totalUnreadNotifications,
      documentNotifications: unreadDocumentNotifications,
      cardNotifications: unreadCardNotifications,
      voteNotifications: unreadVoteNotifications,
      bountyNotifications: unreadBountyNotifications,
      forumNotifications: unreadForumNotifications,
      proposalNotifications: unreadProposalNotifications
    });
  }

  return notifications.filter((notification) => notification.totalUnreadNotifications > 0);
}

async function sendNotification(notification: PendingNotifications) {
  const notificationIds = [
    ...notification.proposalNotifications.map((proposalTask) => proposalTask.taskId),
    ...notification.documentNotifications.map((discussionTask) => discussionTask.taskId),
    ...notification.cardNotifications.map((cardTask) => cardTask.taskId),
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
      discussionTaskIds: notification.documentNotifications.map((discussionTask) => discussionTask.taskId),
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
