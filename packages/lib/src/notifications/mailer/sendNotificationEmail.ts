import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { FeatureJson } from '@packages/features/constants';
import { charmBlue as blueColor } from '@packages/config/colors';
import * as mailer from '@packages/lib/mailer';
import * as emails from '@packages/lib/mailer/emails';
import { getMemberUsernameBySpaceRole } from '@packages/lib/members/getMemberUsername';
import { getCardNotifications } from '@packages/lib/notifications/cards/getCardNotifications';
import { getDocumentNotifications } from '@packages/lib/notifications/documents/getDocumentNotifications';
import { getPostNotifications } from '@packages/lib/notifications/forum/getForumNotifications';
import type { Notification, NotificationGroup } from '@packages/lib/notifications/interfaces';
import { getPollNotifications } from '@packages/lib/notifications/polls/getPollNotifications';
import { getProposalNotifications } from '@packages/lib/notifications/proposals/getProposalNotifications';
import { getBountyNotifications } from '@packages/lib/notifications/rewards/getRewardNotifications';
import type { MessagesSendResult } from 'mailgun.js';

const notificationSelectFields = {
  notificationMetadata: {
    select: { user: { select: { id: true, email: true, username: true, emailNotifications: true, avatar: true } } }
  }
};

export type NotificationEmailInput = { id: string; type: NotificationGroup };

export async function sendNotificationEmail({
  id,
  type
}: NotificationEmailInput): Promise<MessagesSendResult | undefined> {
  switch (type) {
    case 'card': {
      const {
        notificationMetadata: { user }
      } = await prisma.cardNotification.findFirstOrThrow({
        where: { id },
        select: notificationSelectFields
      });
      if (user.email && user.emailNotifications) {
        const notifications = await getCardNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        const notifications = await getPostNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        const notifications = await getDocumentNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        const notifications = await getPollNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        const notifications = await getProposalNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
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
        const notifications = await getBountyNotifications({ id, userId: user.id });
        if (notifications.length) {
          return sendEmail({
            notification: notifications[0],
            user: {
              email: user.email,
              username: user.username,
              id: user.id,
              avatar: user.avatar
            }
          });
        }
      }
      break;
    }
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
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
      features: true,
      emailBrandArtwork: true,
      emailBrandColor: true
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

  const template = await emails.getPendingNotificationEmail({
    notification,
    user: { ...user, username: primaryIdentity },
    spaceFeatures,
    emailBranding: {
      artwork: space.emailBrandArtwork || '',
      color: space.emailBrandColor || blueColor
    }
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
