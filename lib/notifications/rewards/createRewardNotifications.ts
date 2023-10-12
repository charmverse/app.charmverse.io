/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

import { getBountyReviewerIds } from 'lib/bounties/getBountyReviewerIds';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import { createBountyNotification } from '../saveNotification';

export async function createRewardNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
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

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);
      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: application.createdBy,
            spaceId,
            type: 'application.created',
            userId: bountyReviewerId,
            applicationId
          });
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
        await createBountyNotification({
          bountyId,
          createdBy: application.acceptedBy,
          spaceId,
          type: 'application.approved',
          userId: application.createdBy,
          applicationId
        });
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

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'application.rejected',
        userId: application.createdBy,
        applicationId
      });

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

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: application.createdBy,
            spaceId,
            type: 'submission.created',
            userId: bountyReviewerId,
            applicationId
          });
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

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'submission.approved',
        userId: application.createdBy,
        applicationId
      });

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (userId !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: userId,
            spaceId,
            type: 'application.payment_pending',
            userId: bountyReviewerId,
            applicationId
          });
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

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'application.payment_completed',
        userId: application.createdBy,
        applicationId
      });

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
          await createBountyNotification({
            bountyId,
            createdBy: bounty.createdBy,
            spaceId,
            type: 'suggestion.created',
            userId: spaceAdminUserId
          });
        }
      }

      break;
    }

    default:
      break;
  }
}
