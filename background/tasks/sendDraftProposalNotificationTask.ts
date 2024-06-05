import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { count } from 'lib/metrics';
import { sendNotificationEmail } from 'lib/notifications/mailer/sendNotificationEmail';
import { saveProposalNotification } from 'lib/notifications/saveNotification';

export async function sendDraftProposalNotificationTask() {
  const workflowsWithDraftReminder = await prisma.proposalWorkflow.findMany({
    where: {
      draftReminder: true
    },
    select: {
      proposals: {
        select: {
          id: true,
          spaceId: true,
          authors: true
        },
        where: {
          notifications: {
            none: {
              type: 'draft_reminder'
            }
          },
          archived: false,
          status: 'draft',
          page: {
            createdAt: {
              // Within 48 hrs
              gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
            }
          }
        }
      }
    }
  });

  const proposalsWithAuthor = workflowsWithDraftReminder
    .flatMap((workflow) =>
      workflow.proposals.map((proposal) =>
        proposal.authors.map((author) => ({
          authorId: author.userId,
          proposalId: proposal.id,
          spaceId: proposal.spaceId
        }))
      )
    )
    .flat();

  let notificationCount = 0;

  for (const proposalWithAuthor of proposalsWithAuthor) {
    try {
      const proposalNotification = await saveProposalNotification({
        createdAt: new Date().toDateString(),
        createdBy: proposalWithAuthor.authorId,
        proposalId: proposalWithAuthor.proposalId,
        spaceId: proposalWithAuthor.spaceId,
        type: 'draft_reminder',
        userId: proposalWithAuthor.authorId,
        evaluationId: null
      });

      const sent = await sendNotificationEmail({
        id: proposalNotification.id,
        type: 'proposals'
      });

      if (sent) {
        notificationCount += 1;
      }
    } catch (error: any) {
      log.error(`Error sending draft proposal notification: ${error.stack || error.message || error}`, {
        error,
        proposalId: proposalWithAuthor.proposalId,
        userId: proposalWithAuthor.authorId
      });
    }
  }

  if (notificationCount > 0) {
    log.info(`Sent ${notificationCount} draft proposal notifications`);
    count('cron.user-notifications.sent', notificationCount);
  }
}
