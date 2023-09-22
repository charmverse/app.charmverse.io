import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { RateLimit } from 'async-sema';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotifications } from 'lib/mailer/emails/templates/PendingTasksTemplate';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getDiscussionNotifications } from 'lib/notifications/getDiscussionNotifications';
import { getForumNotifications } from 'lib/notifications/getForumNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';

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
  const usersWithSafes = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: [{ email: { not: null } }, { email: { not: '' } }, { emailNotifications: true }]
    },
    // select only the fields that are needed
    select: {
      gnosisSafes: true,
      notificationState: true,
      id: true,
      username: true,
      email: true
    }
  });

  // filter out users that have snoozed notifications
  const activeUsersWithSafes = usersWithSafes.filter((user) => {
    const snoozedUntil = user.notificationState?.snoozedUntil;
    return !snoozedUntil || snoozedUntil > new Date();
  });

  const notifications: PendingNotifications[] = [];

  // Because we have a large number of queries in parallel we need to avoid Promise.all and chain them one by one
  for (const user of activeUsersWithSafes) {
    // Since we will be calling permissions API, we want to ensure we don't flood it with requests
    await notificationTaskLimiter();

    const discussionNotifications = await getDiscussionNotifications(user.id);
    const voteNotifications = await getVoteNotifications(user.id);
    const bountyNotifications = await getBountyNotifications(user.id);
    const forumNotifications = await getForumNotifications(user.id);
    const proposalNotifications = await getProposalNotifications(user.id);

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
  const { bountyNotifications, discussionNotifications, forumNotifications, proposalNotifications, voteNotifications } =
    notification;

  const notificationIds = [
    bountyNotifications.map((n) => n.id),
    discussionNotifications.map((n) => n.id),
    forumNotifications.map((n) => n.id),
    proposalNotifications.map((n) => n.id),
    voteNotifications.map((n) => n.id)
  ].flat();

  try {
    await prisma.userNotificationMetadata.updateMany({
      where: {
        id: {
          in: notificationIds
        }
      },
      data: {
        channel: 'email',
        seenAt: new Date()
      }
    });
  } catch (error) {
    log.error(`Error trying to save notification for user`, {
      userId: notification.user.id,
      error,
      forumNotificationIds: forumNotifications.map((n) => n.id),
      discussionNotificationIds: discussionNotifications.map((n) => n.id),
      proposalNotificationIds: proposalNotifications.map((n) => n.id),
      voteNotificationIds: voteNotifications.map((n) => n.id),
      bountyNotificationIds: bountyNotifications.map((n) => n.id)
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
