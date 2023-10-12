import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotificationsData } from 'lib/mailer/emails/templates/PendingNotificationsTemplate';
import { getCardNotifications } from 'lib/notifications/cards/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/documents/getDocumentNotifications';
import { getPostNotifications } from 'lib/notifications/forum/getForumNotifications';
import { getPollNotifications } from 'lib/notifications/polls/getPollNotifications';
import { getProposalNotifications } from 'lib/notifications/proposals/getProposalNotifications';
import { getBountyNotifications } from 'lib/notifications/rewards/getRewardNotifications';
import { isUUID } from 'lib/utilities/strings';

const notificationNotificationLimiter = RateLimit(100);

export async function sendUserNotifications(): Promise<number> {
  const notificationsToSend = await getNotifications();

  for (const notification of notificationsToSend) {
    log.debug('Send notification to user', {
      userId: notification.user.id,
      notifications: notification.totalUnreadNotifications
    });
    await sendNotification(notification);
  }

  return notificationsToSend.length;
}

export async function getNotifications(): Promise<PendingNotificationsData[]> {
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

  const notifications: PendingNotificationsData[] = [];

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  for (const user of notificationActivatedUsers) {
    // Since we will be calling permissions API, we want to ensure we don't flood it with requests
    await notificationNotificationLimiter();

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
      getPollNotifications(user.id),
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
      user: user as PendingNotificationsData['user'],
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

async function sendNotification(notification: PendingNotificationsData) {
  const notificationIds = [
    ...notification.proposalNotifications.map((proposalNotification) => proposalNotification.id),
    ...notification.documentNotifications.map((discussionNotification) => discussionNotification.id),
    ...notification.cardNotifications.map((cardNotification) => cardNotification.id),
    ...notification.voteNotifications.map((voteNotification) => voteNotification.id),
    ...notification.bountyNotifications.map((bountyNotification) => bountyNotification.id),
    ...notification.forumNotifications.map((forumNotification) => forumNotification.id)
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
      forumNotificationIds: notification.forumNotifications.map((forumNotification) => forumNotification.id),
      proposalNotificationIds: notification.proposalNotifications.map(
        (proposalNotification) => proposalNotification.id
      ),
      voteNotificationIds: notification.voteNotifications.map((voteNotification) => voteNotification.id),
      discussionNotificationIds: notification.documentNotifications.map(
        (discussionNotification) => discussionNotification.id
      ),
      bountyNotificationIds: notification.bountyNotifications.map((bountyNotification) => bountyNotification.id)
    });
    return undefined;
  }

  const template = emails.getPendingNotificationsEmail(notification);
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
