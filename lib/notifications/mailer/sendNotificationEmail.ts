import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import { getCardNotifications } from 'lib/notifications/cards/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/documents/getDocumentNotifications';
import { getPostNotifications } from 'lib/notifications/forum/getForumNotifications';
import type { Notification, NotificationGroup } from 'lib/notifications/interfaces';
import { getPollNotifications } from 'lib/notifications/polls/getPollNotifications';
import { getProposalNotifications } from 'lib/notifications/proposals/getProposalNotifications';
import { getBountyNotifications } from 'lib/notifications/rewards/getRewardNotifications';

const notificationSelectFields = {
  notificationMetadata: {
    select: { user: { select: { id: true, email: true, username: true, emailNotifications: true, avatar: true } } }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        if (notifications.length) {
          await sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
  notification,
  user
}: {
  notification: Notification;
  user: Pick<User, 'id' | 'username' | 'id' | 'avatar' | 'email'>;
}) {
  const notificationSpaceId = notification.spaceId;
  const userId = notification.createdBy.id;

  const memberProperty = await prisma.memberProperty.findFirst({
    where: {
      spaceId: notificationSpaceId,
      type: 'name'
    },
    select: {
      id: true
    }
  });

  if (memberProperty) {
    const notificationAuthorNamePropertyValue = await prisma.memberPropertyValue.findFirst({
      where: {
        spaceId: notificationSpaceId,
        userId,
        memberPropertyId: memberProperty.id
      },
      select: {
        value: true
      }
    });

    if (notificationAuthorNamePropertyValue?.value) {
      notification.createdBy.username = notificationAuthorNamePropertyValue.value as string;
    }

    const notificationTargetNamePropertyValue = await prisma.memberPropertyValue.findFirst({
      where: {
        spaceId: notificationSpaceId,
        userId: user.id,
        memberPropertyId: memberProperty.id
      },
      select: {
        value: true
      }
    });
    if (notificationTargetNamePropertyValue?.value) {
      user.username = notificationTargetNamePropertyValue.value as string;
    }
  }

  const template = emails.getPendingNotificationEmail(notification, user);
  const result = await mailer.sendEmail({
    to: {
      displayName: user.username,
      email: user.email!,
      userId: user.id
    },
    subject: template.subject,
    html: template.html
  });

  return result;
}
