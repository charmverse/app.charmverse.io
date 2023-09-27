import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import { v4 } from 'uuid';

import type {
  BlockCommentNotification,
  BlockCommentNotificationType,
  InlineCommentNotification,
  InlineCommentNotificationType,
  MentionNotification,
  MentionNotificationType
} from './interfaces';
import { upgradedNotificationUserIds } from './utils';

type CreateDocumentNotificationInput = {
  createdBy: string;
  pageId: string;
  spaceId: string;
  userId: string;
  mentionId?: string;
  inlineCommentId?: string;
} & (InlineCommentNotification | MentionNotification);

export async function createDocumentNotification({
  createdBy,
  mentionId,
  pageId,
  inlineCommentId,
  spaceId,
  userId,
  type
}: CreateDocumentNotificationInput) {
  const notificationId = v4();
  await prisma.documentNotification.create({
    data: {
      type,
      id: notificationId,
      mentionId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId,
          seenAt: upgradedNotificationUserIds.includes(userId) ? undefined : new Date()
        }
      },
      inlineComment: inlineCommentId
        ? {
            connect: {
              id: inlineCommentId
            }
          }
        : undefined,
      page: {
        connect: {
          id: pageId
        }
      }
    }
  });
}

export type CreateCardNotificationInput = {
  type: BlockCommentNotificationType | InlineCommentNotificationType | MentionNotificationType | 'person_assigned';
  cardId: string;
  createdBy: string;
  spaceId: string;
  userId: string;
  blockCommentId?: string;
  personPropertyId?: string;
} & (
  | BlockCommentNotification
  | {
      type: 'person_assigned';
      personPropertyId: string;
    }
);

export async function createCardNotification({
  type,
  personPropertyId,
  createdBy,
  spaceId,
  userId,
  blockCommentId,
  cardId
}: CreateCardNotificationInput) {
  const notificationId = v4();
  await prisma.cardNotification.create({
    data: {
      type,
      id: notificationId,
      notificationMetadata: {
        create: {
          id: notificationId,
          createdBy,
          spaceId,
          userId,
          seenAt: upgradedNotificationUserIds.includes(userId) ? undefined : new Date()
        }
      },
      blockComment: blockCommentId
        ? {
            connect: {
              id: blockCommentId
            }
          }
        : undefined,
      card: { connect: { id: cardId } },
      personPropertyId
    }
  });
}
