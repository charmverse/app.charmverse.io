import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { count } from 'lib/metrics';
import { sendNotificationEmail } from 'lib/notifications/mailer/sendNotificationEmail';
import { saveProposalNotification } from 'lib/notifications/saveNotification';
import { isTruthy } from 'lib/utils/types';

export async function sendProposalEvaluationNotifications() {
  const proposals = await prisma.proposal.findMany({
    where: {
      page: {
        deletedAt: null,
        isTemplate: false
      },
      archived: false,
      status: 'published',
      evaluations: {
        some: {
          dueDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            gte: new Date()
          },
          result: null
        }
      }
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      authors: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        select: {
          finalStep: true,
          appealedAt: true,
          result: true,
          index: true,
          dueDate: true,
          id: true,
          reviewers: true
        }
      }
    }
  });

  let notificationCount = 0;
  for (const proposal of proposals) {
    try {
      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      const dueDate = currentEvaluation?.dueDate;
      const existingNotification = currentEvaluation
        ? await prisma.proposalNotification.findFirst({
            where: {
              type: 'evaluation_reminder',
              evaluationId: currentEvaluation.id,
              proposalId: proposal.id
            }
          })
        : null;

      if (
        !existingNotification &&
        currentEvaluation &&
        dueDate &&
        dueDate <= new Date(Date.now() + 24 * 60 * 60 * 1000)
      ) {
        const reviewerIds = currentEvaluation.reviewers.map((r) => r.userId).filter(isTruthy);
        const hasAuthorSystemRole = currentEvaluation.reviewers.some((r) => r.systemRole === 'author');

        const roles = await prisma.role.findMany({
          where: {
            id: {
              in: currentEvaluation.reviewers.map((r) => r.roleId).filter(isTruthy)
            }
          },
          select: {
            spaceRolesToRole: {
              select: {
                spaceRole: {
                  select: {
                    userId: true
                  }
                }
              }
            }
          }
        });

        const reviewerIdsByRoles = roles.map((r) => r.spaceRolesToRole.map((s) => s.spaceRole.userId)).flat();

        const uniqueReviewerIds = Array.from(
          new Set([
            ...reviewerIds,
            ...reviewerIdsByRoles,
            ...(hasAuthorSystemRole ? proposal.authors.map((a) => a.userId) : [])
          ])
        );

        for (const reviewerId of uniqueReviewerIds) {
          const proposalNotification = await saveProposalNotification({
            createdAt: new Date().toISOString(),
            createdBy: proposal.createdBy,
            proposalId: proposal.id,
            spaceId: proposal.spaceId,
            type: 'evaluation_reminder',
            userId: reviewerId,
            evaluationId: currentEvaluation.id
          });

          const sent = await sendNotificationEmail({
            id: proposalNotification.id,
            type: 'proposals'
          });

          if (sent) {
            notificationCount += 1;
          }
        }
      }
    } catch (error: any) {
      log.error(`Error sending proposal evaluation notification`, {
        error,
        proposalId: proposal.id,
        spaceId: proposal.spaceId
      });
    }
  }

  if (notificationCount > 0) {
    log.info(`Sent ${notificationCount} proposal evaluation due date reminders`);
    count('cron.user-notifications.sent', notificationCount);
  }

  return { notificationCount };
}
