import { prisma } from '@charmverse/core/prisma-client';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import type { PendingNotificationsData } from 'lib/mailer/emails/templates/PendingNotificationsTemplate';
import { getCardNotifications } from 'lib/notifications/cards/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/documents/getDocumentNotifications';
import { getPostNotifications } from 'lib/notifications/forum/getForumNotifications';
import type { NotificationGroup } from 'lib/notifications/interfaces';
import { getPollNotifications } from 'lib/notifications/polls/getPollNotifications';
import { getProposalNotifications } from 'lib/notifications/proposals/getProposalNotifications';
import { getBountyNotifications } from 'lib/notifications/rewards/getRewardNotifications';

const notificationSelectFields = {
  notificationMetadata: {
    select: { user: { select: { id: true, email: true, username: true, emailNotifications: true } } }
  }
};

export type NotificationEmailInput = { id: string; type: NotificationGroup };

export async function sendNotificationEmail({ id, type }: NotificationEmailInput): Promise<boolean> {
  switch (type) {
    case 'card': {
      const {
        notificationMetadata: { user }
      } = await prisma.cardNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getCardNotifications({ id });
        await sendEmail({
          notification: {
            cardNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    case 'forum': {
      const {
        notificationMetadata: { user }
      } = await prisma.postNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getPostNotifications({ id });
        await sendEmail({
          notification: {
            forumNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    case 'documents': {
      const {
        notificationMetadata: { user }
      } = await prisma.documentNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getDocumentNotifications({ id });
        await sendEmail({
          notification: {
            documentNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    case 'polls': {
      const {
        notificationMetadata: { user }
      } = await prisma.voteNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getPollNotifications({ id });
        await sendEmail({
          notification: {
            voteNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    case 'proposals': {
      const {
        notificationMetadata: { user }
      } = await prisma.proposalNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getProposalNotifications({ id });
        await sendEmail({
          notification: {
            proposalNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    case 'rewards': {
      const {
        notificationMetadata: { user }
      } = await prisma.bountyNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getBountyNotifications({ id });
        await sendEmail({
          notification: {
            bountyNotifications: notifications
          },
          user: user as PendingNotificationsData['user']
        });
        return true;
      }
      break;
    }
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
  return false;
}

async function sendEmail({
  user,
  notification
}: {
  user: { id: string; username: string; email: string };
  notification: Partial<PendingNotificationsData>;
}) {
  const template = emails.getPendingNotificationsEmail({
    user,
    totalUnreadNotifications: 1,
    bountyNotifications: [],
    cardNotifications: [],
    documentNotifications: [],
    forumNotifications: [],
    voteNotifications: [],
    proposalNotifications: [],
    ...notification
  });
  const result = await mailer.sendEmail({
    to: {
      displayName: user.username,
      email: user.email
    },
    subject: template.subject,
    html: template.html
  });

  return result;
}
