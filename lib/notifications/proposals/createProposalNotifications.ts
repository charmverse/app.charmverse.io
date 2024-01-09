/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposalAction } from 'lib/proposal/getProposalAction';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

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

      if (!currentEvaluationId) {
        break;
      }

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          evaluations: {
            select: {
              index: true,
              result: true,
              type: true,
              id: true
            },
            orderBy: {
              index: 'asc'
            }
          },
          rewards: {
            select: {
              id: true
            }
          },
          status: true,
          authors: {
            select: {
              userId: true
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

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          notificationToggles: true
        }
      });

      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          userId: true
        }
      });

      for (const spaceRole of spaceRoles) {
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }
        const proposalPermissionsRecord = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: proposalId,
          userId: spaceRole.userId
        });

        const currentEvaluationPermissions = proposalPermissionsRecord[currentEvaluationId];

        if (!currentEvaluationPermissions.view) {
          continue;
        }

        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer = currentEvaluationPermissions.review || currentEvaluationPermissions.evaluate;
        const isVoter = currentEvaluationPermissions.vote && currentEvaluationPermissions.view;
        const canComment = currentEvaluationPermissions.comment && currentEvaluationPermissions.view;
        const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];
        const previousEvaluation =
          currentEvaluation?.index && currentEvaluation.index > 0 && currentEvaluation.id !== lastEvaluation.id
            ? proposal.evaluations[currentEvaluation.index - 1]
            : null;

        const action = getProposalAction({
          isAuthor,
          isReviewer,
          isVoter,
          proposal,
          canComment
        });

        if (!action) {
          continue;
        }

        // check notification preferences
        const notificationToggles = space.notificationToggles as NotificationToggles;
        if (notificationToggles[`proposals__${action}`] === false) {
          continue;
        }

        const { id } = await saveProposalNotification({
          createdAt: webhookData.createdAt,
          createdBy: userId,
          proposalId,
          spaceId,
          userId: spaceRole.userId,
          type: action,
          evaluationId:
            action === 'proposal_failed' && previousEvaluation ? previousEvaluation.id : currentEvaluation.id
        });

        if (action === 'proposal_passed') {
          await publishProposalEvent({
            proposalId,
            scope: WebhookEventNames.ProposalPassed,
            spaceId
          });
        } else if (action === 'proposal_failed') {
          await publishProposalEvent({
            proposalId,
            scope: WebhookEventNames.ProposalFailed,
            spaceId
          });
        }
        ids.push(id);
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
