/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { getRewardReviewerIds } from '@packages/lib/rewards/getRewardReviewerIds';
import type { WebhookEvent } from '@packages/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';

import { saveRewardNotification } from '../saveNotification';

export async function createRewardNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.RewardApplicationCreated: {
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const applicationId = webhookData.event.application.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const bountyReviewerIds = await getRewardReviewerIds(bountyId);
      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          const { id } = await saveRewardNotification({
            bountyId,
            createdAt: webhookData.createdAt,
            createdBy: application.createdBy,
            spaceId,
            type: 'application.created',
            userId: bountyReviewerId,
            applicationId
          });
          ids.push(id);
        }
      }

      break;
    }

    case WebhookEventNames.RewardApplicationApproved: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true,
          acceptedBy: true
        }
      });

      if (application.acceptedBy) {
        const { id } = await saveRewardNotification({
          bountyId,
          createdAt: webhookData.createdAt,
          createdBy: application.acceptedBy,
          spaceId,
          type: 'application.approved',
          userId: application.createdBy,
          applicationId
        });
        ids.push(id);
      }

      break;
    }

    case WebhookEventNames.RewardApplicationRejected: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const { id } = await saveRewardNotification({
        bountyId,
        createdAt: webhookData.createdAt,
        createdBy: userId,
        spaceId,
        type: 'application.rejected',
        userId: application.createdBy,
        applicationId
      });
      ids.push(id);

      break;
    }

    case WebhookEventNames.RewardSubmissionCreated: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const bountyReviewerIds = await getRewardReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          const { id } = await saveRewardNotification({
            bountyId,
            createdAt: webhookData.createdAt,
            createdBy: application.createdBy,
            spaceId,
            type: 'submission.created',
            userId: bountyReviewerId,
            applicationId
          });
          ids.push(id);
        }
      }

      break;
    }

    case WebhookEventNames.RewardSubmissionApproved: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const { id } = await saveRewardNotification({
        bountyId,
        createdAt: webhookData.createdAt,
        createdBy: userId,
        spaceId,
        type: 'submission.approved',
        userId: application.createdBy,
        applicationId
      });
      ids.push(id);

      const bountyReviewerIds = await getRewardReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (userId !== bountyReviewerId && application.createdBy !== bountyReviewerId) {
          const { id: _id } = await saveRewardNotification({
            bountyId,
            createdAt: webhookData.createdAt,
            createdBy: userId,
            spaceId,
            type: 'application.payment_pending',
            userId: bountyReviewerId,
            applicationId
          });
          ids.push(_id);
        }
      }

      break;
    }

    case WebhookEventNames.RewardApplicationPaymentCompleted: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const { id } = await saveRewardNotification({
        bountyId,
        createdAt: webhookData.createdAt,
        createdBy: userId,
        spaceId,
        type: 'application.payment_completed',
        userId: application.createdBy,
        applicationId
      });
      ids.push(id);

      break;
    }

    case WebhookEventNames.RewardSuggestionCreated: {
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const spaceAdmins = await prisma.spaceRole.findMany({
        where: {
          spaceId,
          isAdmin: true
        },
        select: {
          userId: true
        }
      });

      const bounty = await prisma.bounty.findUniqueOrThrow({
        where: {
          id: bountyId
        },
        select: {
          createdBy: true
        }
      });

      const spaceAdminUserIds = spaceAdmins.map(({ userId }) => userId);

      for (const spaceAdminUserId of spaceAdminUserIds) {
        if (spaceAdminUserId !== bounty.createdBy) {
          const { id } = await saveRewardNotification({
            bountyId,
            createdAt: webhookData.createdAt,
            createdBy: bounty.createdBy,
            spaceId,
            type: 'suggestion.created',
            userId: spaceAdminUserId
          });
          ids.push(id);
        }
      }

      break;
    }
    case WebhookEventNames.RewardCredentialCreated: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const { id } = await saveRewardNotification({
        bountyId,
        createdAt: webhookData.createdAt,
        createdBy: userId,
        spaceId,
        type: 'credential.created',
        userId: application.createdBy,
        applicationId
      });
      ids.push(id);

      break;
    }
    default:
      break;
  }
  return ids;
}
