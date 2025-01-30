/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation, privateEvaluationSteps } from '@charmverse/core/proposals';
import { permissionsApiClient } from '@root/lib/permissions/api/client';
import { getProposalAction } from '@root/lib/proposals/getProposalAction';
import type { WebhookEvent } from '@root/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';

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
          workflow: {
            select: {
              privateEvaluations: true
            }
          },
          evaluations: {
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
        const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: proposalId,
          userId: spaceRole.userId
        });

        if (!proposalPermissions.view) {
          continue;
        }

        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer = proposalPermissions.evaluate;

        // New proposal permissions .vote is invalid
        const isVoter = proposalPermissions.evaluate;
        const canComment = proposalPermissions.comment && proposalPermissions.view;

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

        // Only notify reviewers for hidden evaluations
        if (
          proposal.workflow?.privateEvaluations &&
          !isReviewer &&
          // Allow these following notifications for proposal authors
          action !== 'proposal_passed' &&
          action !== 'proposal_failed' &&
          action !== 'reward_published' &&
          privateEvaluationSteps.includes(currentEvaluation.type)
        ) {
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
          evaluationId: currentEvaluation.id
        });

        ids.push(id);
      }

      break;
    }
    case WebhookEventNames.ProposalCredentialCreated: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        }
      });

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          notificationToggles: true
        }
      });

      // check notification preferences
      const notificationToggles = space.notificationToggles as NotificationToggles;
      if (notificationToggles.proposals__credential_created === false) {
        break;
      }

      const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
        resourceId: proposalId,
        userId
      });

      if (!proposalPermissions.view) {
        break;
      }

      const { id } = await saveProposalNotification({
        createdAt: webhookData.createdAt,
        createdBy: proposal.createdBy,
        proposalId,
        spaceId,
        userId,
        type: 'credential_created',
        evaluationId: null
      });

      ids.push(id);

      break;
    }

    case WebhookEventNames.ProposalAppealed: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          workflow: {
            select: {
              privateEvaluations: true
            }
          },
          page: {
            select: {
              deletedAt: true
            }
          },
          evaluations: {
            select: {
              index: true,
              result: true,
              type: true,
              id: true,
              finalStep: true,
              appealReviewers: true,
              appealedAt: true
            },
            orderBy: {
              index: 'asc'
            }
          }
        }
      });

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          notificationToggles: true
        }
      });

      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      const isProposalDeleted = proposal.page?.deletedAt;

      if (!currentEvaluation || isProposalDeleted) {
        break;
      }

      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          userId: true
        }
      });

      const notificationToggles = space.notificationToggles as NotificationToggles;
      if (notificationToggles.proposals__review_required === false) {
        break;
      }

      for (const spaceRole of spaceRoles) {
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }
        const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: proposalId,
          userId: spaceRole.userId
        });

        const isAppealReviewer = proposalPermissions.evaluate_appeal;

        if (!isAppealReviewer) {
          continue;
        }

        const { id } = await saveProposalNotification({
          createdAt: webhookData.createdAt,
          createdBy: userId,
          proposalId,
          spaceId,
          userId: spaceRole.userId,
          type: 'proposal_appealed',
          evaluationId: currentEvaluation.id
        });

        ids.push(id);
      }

      break;
    }

    case WebhookEventNames.ProposalPublished: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          authors: true,
          page: {
            select: {
              deletedAt: true
            }
          }
        }
      });

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          notificationToggles: true
        }
      });

      const isProposalDeleted = proposal.page?.deletedAt;

      if (isProposalDeleted) {
        break;
      }

      const notificationToggles = space.notificationToggles as NotificationToggles;
      if (notificationToggles.proposals__proposal_published === false) {
        break;
      }

      for (const author of proposal.authors) {
        const { id } = await saveProposalNotification({
          createdAt: webhookData.createdAt,
          createdBy: userId,
          proposalId,
          spaceId,
          userId: author.userId,
          type: 'proposal_published'
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
