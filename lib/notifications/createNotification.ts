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

type CreateDocumentNotificationInput = {
  createdBy: string;
  pageId: string;
  spaceId: string;
  userId: string;
  commentId?: string;
  mentionId?: string;
  inlineCommentId?: string;
} & (InlineCommentNotification | MentionNotification);

export async function createDocumentNotification({
  createdBy,
  commentId,
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
          userId
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
  mentionId?: string;
  inlineCommentId?: string;
  personPropertyId?: string;
} & (
  | BlockCommentNotification
  | InlineCommentNotification
  | MentionNotification
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
  inlineCommentId,
  mentionId,
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
          userId
        }
      },
      blockComment: blockCommentId
        ? {
            connect: {
              id: blockCommentId
            }
          }
        : undefined,
      inlineComment: inlineCommentId ? { connect: { id: inlineCommentId } } : undefined,
      mentionId,
      card: { connect: { id: cardId } },
      personPropertyId
    }
  });
}
