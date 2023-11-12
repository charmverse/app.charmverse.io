/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { getPermissionsClient } from 'lib/permissions/api/routers';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

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
          page: {
            select: { id: true }
          },
          post: {
            select: { id: true }
          },
          author: {
            select: {
              id: true
            }
          }
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

      const spaceUserIds = spaceRoles.map(({ userId }) => userId).filter((userId) => userId !== vote.author.id);

      const permissionClient = await getPermissionsClient({
        resourceId: spaceId,
        resourceIdType: 'space'
      });

      if (vote.page) {
        for (const spaceUserId of spaceUserIds) {
          const pagePermission = await permissionClient.client.pages.computePagePermissions({
            resourceId: vote.page.id,
            userId: spaceUserId
          });
          if (pagePermission.comment) {
            const { id } = await savePollNotification({
              createdAt: webhookData.createdAt,
              createdBy: vote.author.id,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
            ids.push(id);
          }
        }
      } else if (vote.post) {
        for (const spaceUserId of spaceUserIds) {
          const postPermission = await permissionClient.client.forum.computePostPermissions({
            resourceId: vote.post.id,
            userId: spaceUserId
          });

          if (postPermission.add_comment) {
            const { id } = await savePollNotification({
              createdAt: webhookData.createdAt,
              createdBy: vote.author.id,
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
