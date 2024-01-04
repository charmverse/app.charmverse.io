/* eslint-disable no-continue */
import type { ProposalSystemRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

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
      const currentEvaluationId = webhookData.event.currentEvaluationId;
      // Moved to draft stage
      if (!currentEvaluationId) {
        break;
      }

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          createdBy: true,
          categoryId: true,
          evaluations: {
            include: {
              reviewers: true
            }
          },
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

      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      const isProposalDeleted = proposal.page?.deletedAt;

      if (!currentEvaluation || isProposalDeleted) {
        break;
      }

      const proposalAuthorIds = proposal.authors.map(({ userId: authorId }) => authorId);
      const proposalReviewerUserIds: string[] = [];
      const proposalReviewerRoleIds: string[] = [];
      const proposalReviewerSystemRoles: ProposalSystemRole[] = [];

      currentEvaluation.reviewers.forEach(({ roleId, systemRole, userId: _userId }) => {
        if (_userId) {
          proposalReviewerUserIds.push(_userId);
        } else if (roleId) {
          proposalReviewerRoleIds.push(roleId);
        } else if (systemRole) {
          proposalReviewerSystemRoles.push(systemRole);
        }
      });

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
        const proposalPermission = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: proposalId,
          userId: spaceRole.userId
        });

        if (!proposalPermission.view) {
          continue;
        }

        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer =
          proposalReviewerUserIds.includes(spaceRole.userId) ||
          proposalReviewerRoleIds.some((roleId) => roleIds.includes(roleId)) ||
          proposalReviewerSystemRoles.some((systemRole) => systemRole === 'space_member');

        const action = getProposalAction({
          currentStep: currentEvaluation.type,
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
          (action === 'start_discussion' && !proposalPermission.comment) ||
          (action === 'vote' && !proposalPermission.vote)
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
