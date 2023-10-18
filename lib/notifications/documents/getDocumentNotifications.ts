import { prisma } from '@charmverse/core/prisma-client';

import { extractMentions } from 'lib/prosemirror/extractMentions';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import type { DocumentNotification } from '../interfaces';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getDocumentNotifications({ id, userId }: QueryCondition): Promise<DocumentNotification[]> {
  const documentNotifications = await prisma.documentNotification.findMany({
    where: queryCondition({ id, userId }),
    select: {
      id: true,
      type: true,
      content: true,
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
        content: notification.content,
        type: notification.type,
        archived: !!notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt,
        group: 'document'
      } as DocumentNotification;

      return documentNotification;
    })
    .filter(isTruthy);
}
