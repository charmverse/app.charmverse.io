import { prisma } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { isTruthy } from '@packages/utils/types';

import type { DocumentNotification } from '../interfaces';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getDocumentNotifications({ id, userId }: QueryCondition): Promise<DocumentNotification[]> {
  const documentNotifications = await prisma.documentNotification.findMany({
    where: {
      ...queryCondition({ id, userId }),
      OR: [
        {
          page: {
            deletedAt: null,
            space: {
              spaceRoles: {
                some: {
                  userId
                }
              }
            }
          }
        },
        { pageId: null }
      ]
    },
    select: {
      id: true,
      type: true,
      contentText: true,
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
      applicationCommentId: true,
      applicationComment: {
        select: {
          application: {
            select: {
              id: true
            }
          }
        }
      },
      mentionId: true,
      post: {
        select: {
          id: true,
          path: true,
          title: true
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
      const applicationId = notification.applicationComment?.application.id ?? null;

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
        applicationCommentId: notification.applicationCommentId,
        applicationId,
        pageType: page.type,
        // TODO: convert prosemirror content to text
        // content: notification.content,
        type: notification.type,
        archived: !!notificationMetadata.archivedAt,
        read: !!notificationMetadata.seenAt,
        group: 'document'
      } as DocumentNotification;

      return documentNotification;
    })
    .filter(isTruthy);
}
