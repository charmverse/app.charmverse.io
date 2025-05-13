import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { count } from '@packages/metrics';
import { isTruthy } from '@packages/utils/types';
import { sendNotificationEmail } from '@packages/lib/notifications/mailer/sendNotificationEmail';
import { saveProposalNotification } from '@packages/lib/notifications/saveNotification';

export async function sendDraftProposalNotificationTask() {
  const draftProposals = await prisma.proposal.findMany({
    where: {
      archived: false,
      status: 'draft',
      notifications: {
        none: {
          type: 'draft_reminder'
        }
      },
      page: {
        createdAt: {
          // Within 24 hours
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    },
    select: {
      id: true,
      spaceId: true,
      authors: true,
      formAnswers: true,
      workflowId: true,
      page: {
        select: {
          id: true,
          contentText: true,
          title: true
        }
      }
    }
  });

  const workflowIds = [...new Set(draftProposals.map((proposal) => proposal.workflowId).filter(isTruthy))];
  const workflows = await prisma.proposalWorkflow.findMany({
    where: {
      id: {
        in: workflowIds
      }
    },
    select: {
      id: true,
      draftReminder: true
    }
  });
  const sendReminders = workflows.reduce<Record<string, boolean>>((acc, workflow) => {
    acc[workflow.id] = !!workflow.draftReminder;
    return acc;
  }, {});

  const proposalsWithAuthor = draftProposals
    .map((proposal) =>
      proposal.authors.map((author) => ({
        authorId: author.userId,
        proposal
      }))
    )
    .flat();

  let notificationCount = 0;
  let deletedCount = 0;

  // Check if a proposal had any content created for it
  function proposalHasContent(proposal: (typeof proposalsWithAuthor)[0]['proposal']) {
    return (
      !!proposal.page?.contentText || !!proposal.page?.title || proposal.formAnswers.some((answer) => answer.value)
    );
  }

  for (const { proposal, authorId } of proposalsWithAuthor) {
    try {
      if (!proposalHasContent(proposal)) {
        log.info(`Deleting empty proposal ${proposal.id}`, { proposalId: proposal.id, userId: authorId });
        const success = await prisma.proposal
          .delete({
            where: {
              id: proposal.id
            }
          })
          .catch((e) => {
            // ignore error if proposal is already deleted
          });
        await prisma.page
          .delete({
            where: {
              id: proposal.page!.id
            }
          })
          .catch((e) => {
            // ignore error if proposal is already deleted
          });
        if (success) {
          deletedCount += 1;
        }
      } else if (proposal.workflowId && sendReminders[proposal.workflowId]) {
        const proposalNotification = await saveProposalNotification({
          createdAt: new Date().toISOString(),
          createdBy: authorId,
          proposalId: proposal.id,
          spaceId: proposal.spaceId,
          type: 'draft_reminder',
          userId: authorId,
          evaluationId: null
        });

        const sent = await sendNotificationEmail({
          id: proposalNotification.id,
          type: 'proposals'
        });

        if (sent) {
          notificationCount += 1;
        }
      }
    } catch (error: any) {
      log.error(`Error sending draft proposal notification`, {
        error,
        proposalId: proposal.id,
        userId: authorId
      });
    }
  }

  if (notificationCount > 0) {
    log.info(`Sent ${notificationCount} draft proposal notifications`);
    count('cron.user-notifications.sent', notificationCount);
  }
  if (deletedCount > 0) {
    count('cron.user-notifications.deleted-draft-proposals', deletedCount);
  }

  return { deletedCount, notificationCount };
}
