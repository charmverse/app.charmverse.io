/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposalAction } from 'lib/proposal/getProposalAction';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import type { NotificationToggles } from '../notificationToggles';
import { saveProposalNotification } from '../saveNotification';

export async function createProposalNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.ProposalStatusChanged: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;
      const newStatus = webhookData.event.newStatus;
      if (newStatus === 'draft') {
        break;
      }

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          createdBy: true,
          status: true,
          authors: {
            select: {
              userId: true
            }
          },
          reviewers: {
            select: {
              userId: true,
              role: {
                select: {
                  id: true
                }
              }
            }
          },
          page: {
            select: {
              deletedAt: true
            }
          }
        }
      });

      const isProposalDeleted = proposal.page?.deletedAt;
      if (isProposalDeleted) {
        break;
      }

      const proposalAuthorIds = proposal.authors.map(({ userId: authorId }) => authorId);
      const proposalReviewerIds = proposal.reviewers.map(({ userId: reviewerId }) => reviewerId);
      const proposalReviewerRoleIds = proposal.reviewers
        .map(({ role }) => role?.id)
        .filter((roleId) => roleId) as string[];

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          domain: true,
          name: true,
          paidTier: true,
          notificationToggles: true
        }
      });

      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          userId: true,
          id: true,
          isAdmin: true,
          spaceRoleToRole: {
            select: {
              role: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      for (const spaceRole of spaceRoles) {
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }
        // We should not send role-based notifications for free spaces
        const roleIds = space.paidTier === 'free' ? [] : spaceRole.spaceRoleToRole.map(({ role }) => role.id);
        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer =
          proposalReviewerIds.includes(spaceRole.userId) ||
          proposalReviewerRoleIds.some((roleId) => roleIds.includes(roleId));

        const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: proposalId
        });

        const isProposalAccessible = proposalPermissions.view;

        if (!isProposalAccessible) {
          return [];
        }

        const action = getProposalAction({
          currentStatus: proposal.status,
          isAuthor,
          isReviewer
        });

        if (!action) {
          continue;
        }

        // check notification preferences
        const notificationToggles = space.notificationToggles as NotificationToggles;
        if (notificationToggles[`proposals__${action}`] === false) {
          continue;
        }

        if (
          (action === 'start_discussion' && !proposalPermissions.comment) ||
          (action === 'vote' && !proposalPermissions.vote)
        ) {
          continue;
        }

        const { id } = await saveProposalNotification({
          createdAt: webhookData.createdAt,
          createdBy: userId,
          proposalId,
          spaceId,
          userId: spaceRole.userId,
          type: action
        });
        ids.push(id);
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
