import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { count } from '@packages/metrics';
import { isTruthy } from '@packages/utils/types';
import { sendNotificationEmail } from '@packages/lib/notifications/mailer/sendNotificationEmail';
import { saveProposalNotification } from '@packages/lib/notifications/saveNotification';

export async function sendProposalEvaluationNotifications(spaceId?: string) {
  const proposals = await prisma.proposal.findMany({
    where: {
      page: {
        deletedAt: null,
        isTemplate: false,
        type: 'proposal'
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
      },
      spaceId
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
        dueDate <= new Date(Date.now() + 24 * 60 * 60 * 1000) &&
        dueDate >= new Date()
      ) {
        const reviewerUserIds: string[] = [];
        const hasAuthorSystemRole = currentEvaluation.reviewers.some((r) => r.systemRole === 'author');
        const hasSpaceMemberRole = currentEvaluation.reviewers.some((r) => r.systemRole === 'space_member');
        const authorIds = proposal.authors.map((a) => a.userId);
        if (hasSpaceMemberRole) {
          const spaceMembers = await prisma.spaceRole.findMany({
            where: {
              spaceId: proposal.spaceId,
              id: {
                notIn: authorIds
              }
            },
            select: {
              userId: true
            }
          });
          spaceMembers.forEach((m) => {
            if (!authorIds.includes(m.userId)) {
              reviewerUserIds.push(m.userId);
            }
          });
        } else {
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
          roles.forEach((r) =>
            r.spaceRolesToRole.forEach((s) => {
              reviewerUserIds.push(s.spaceRole.userId);
            })
          );
          if (hasAuthorSystemRole) {
            authorIds.forEach((a) => reviewerUserIds.push(a));
          }
          currentEvaluation.reviewers.forEach((r) => {
            if (r.userId) {
              reviewerUserIds.push(r.userId);
            }
          });
        }

        const reviewerIds = Array.from(new Set(reviewerUserIds));

        for (const reviewerId of reviewerIds) {
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
