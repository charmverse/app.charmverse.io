import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import type { DocumentNotification, NotificationsGroup } from '../interfaces';
import { notificationMetadataSelectStatement, sortByDate } from '../utils';

export async function getDocumentNotifications(userId: string): Promise<DocumentNotification[]> {
  const documentNotifications = await prisma.documentNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    select: {
      id: true,
      type: true,
      page: {
        select: {
          id: true,
          path: true,
          type: true,
          content: true,
          title: true
        }
      },
      inlineCommentId: true,
      mentionId: true,
      post: {
        select: {
          id: true,
          path: true,
          title: true,
          content: true
        }
      },
      pageComment: {
        select: {
          contentText: true
        }
      },
      postComment: {
        select: {
          contentText: true
        }
      },
      inlineComment: {
        select: {
          content: true
        }
      },
      notificationMetadata: {
        select: {
          ...notificationMetadataSelectStatement,
          user: {
            select: {
              username: true
            }
          }
        }
      }
    }
  });

  return documentNotifications
    .map((notification) => {
      const notificationMetadata = notification.notificationMetadata;
      const page = (notification.post ? { ...notification.post, type: 'post' } : notification.page) as {
        type: string;
        id: string;
        path: string;
        title: string;
        content: PageContent;
      };
      const documentNotification = {
        id: notification.id,
        inlineCommentId: notification.inlineCommentId,
        mentionId: notification.mentionId,
        createdAt: notificationMetadata.createdAt.toISOString(),
        createdBy: notificationMetadata.author,
        pageId: page.id,
        pagePath: page.path,
        pageTitle: page.title || 'Untitled',
        spaceDomain: notificationMetadata.space.domain,
        spaceId: notificationMetadata.spaceId,
        spaceName: notificationMetadata.space.name,
        pageType: page.type,
        text: notification.inlineComment?.content
          ? getNodeFromJson(notification.inlineComment.content).textContent
          : notification.mentionId
          ? extractMentions(page.content).find((mention) => mention.id === notification.mentionId)?.text ||
            `@${notificationMetadata.user.username}`
          : notification.pageComment?.contentText || notification.postComment?.contentText || '',
        type: notification.type,
        archived: !!notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt,
        group: 'document'
      } as DocumentNotification;

      return documentNotification;
    })
    .filter(isTruthy);
}
