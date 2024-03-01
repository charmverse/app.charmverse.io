import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { FeatureJson } from 'lib/features/constants';
import * as mailer from 'lib/mailer';
import * as emails from 'lib/mailer/emails';
import { getMemberUsernameBySpaceRole } from 'lib/members/getMemberUsername';
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
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: notificationSpaceId
    },
    select: {
      features: true
    }
  });
  const spaceFeatures = (space.features ?? []) as FeatureJson[];
  const notificationAuthorSpaceRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      userId: notification.createdBy.id,
      spaceId: notificationSpaceId
    },
    select: {
      id: true
    }
  });

  const notificationTargetSpaceRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      userId: user.id,
      spaceId: notificationSpaceId
    },
    select: {
      id: true
    }
  });

  notification.createdBy.username = await getMemberUsernameBySpaceRole({ spaceRoleId: notificationAuthorSpaceRole.id });
  const primaryIdentity = await getMemberUsernameBySpaceRole({ spaceRoleId: notificationTargetSpaceRole.id });

  const template = emails.getPendingNotificationEmail({
    notification,
    user: { ...user, username: primaryIdentity },
    spaceFeatures
  });
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
