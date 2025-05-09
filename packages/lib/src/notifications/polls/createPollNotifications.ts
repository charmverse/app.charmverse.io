/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getPermissionsClient, permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { WebhookEvent } from '@packages/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

import { savePollNotification } from '../saveNotification';

export async function createPollNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.VoteCreated: {
      const voteId = webhookData.event.vote.id;
      const vote = await prisma.vote.findUniqueOrThrow({
        where: {
          id: voteId,
          status: 'InProgress'
        },
        select: {
          spaceId: true,
          pageId: true,
          postId: true,
          createdBy: true
        }
      });

      const spaceId = vote.spaceId;
      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          id: true,
          userId: true
        }
      });

      const spaceUserIds = spaceRoles.map(({ userId }) => userId).filter((userId) => userId !== vote.createdBy);
      if (vote.pageId) {
        for (const spaceUserId of spaceUserIds) {
          const pagePermission = await permissionsApiClient.pages.computePagePermissions({
            resourceId: vote.pageId,
            userId: spaceUserId
          });
          if (pagePermission.comment) {
            const { id } = await savePollNotification({
              createdAt: webhookData.createdAt,
              createdBy: vote.createdBy,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
            ids.push(id);
          }
        }
      } else if (vote.postId) {
        for (const spaceUserId of spaceUserIds) {
          const permissionClient = await getPermissionsClient({
            resourceId: spaceId,
            resourceIdType: 'space'
          });

          const postPermission = await permissionClient.client.forum.computePostPermissions({
            resourceId: vote.postId,
            userId: spaceUserId
          });

          if (postPermission.add_comment) {
            const { id } = await savePollNotification({
              createdAt: webhookData.createdAt,
              createdBy: vote.createdBy,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
            ids.push(id);
          }
        }
      }
      break;
    }

    default:
      break;
  }
  return ids;
}
