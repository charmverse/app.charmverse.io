import { prisma } from '@charmverse/core/prisma-client';

import { createDraftProposal } from 'lib/proposals/createDraftProposal';
import { publishProposal } from 'lib/proposals/publishProposal';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalWorkflow } from 'testing/utils/proposals';

import { sendDraftProposalNotificationTask } from '../sendDraftProposalNotificationTask';

describe('sendDraftProposalNotificationTask', () => {
  it('Should send draft proposal notifications for draft proposals and when workflow has draftReminder turned on', async () => {
    const { space, user } = await generateUserAndSpace();
    const workflow = await generateProposalWorkflow({
      spaceId: space.id,
      evaluations: [
        {
          type: 'feedback'
        }
      ]
    });

    await prisma.proposalWorkflow.update({
      where: {
        id: workflow.id
      },
      data: {
        draftReminder: true
      }
    });

    const draftProposal1 = await createDraftProposal({
      contentType: 'free_form',
      createdBy: user.id,
      spaceId: space.id,
      pageType: 'proposal'
    });

    const draftProposal2 = await createDraftProposal({
      contentType: 'free_form',
      createdBy: user.id,
      spaceId: space.id,
      pageType: 'proposal'
    });

    await publishProposal({
      proposalId: draftProposal2.proposal.id,
      userId: user.id
    });

    // Created just now so it should not have a notification
    const draftProposal3 = await createDraftProposal({
      contentType: 'free_form',
      createdBy: user.id,
      spaceId: space.id,
      pageType: 'proposal'
    });

    await prisma.page.updateMany({
      where: {
        id: {
          in: [draftProposal1.page.id, draftProposal2.page.id]
        }
      },
      data: {
        // 25 hours ago
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
    });

    await sendDraftProposalNotificationTask();

    const proposal1Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal1.proposal.id
      }
    });

    const proposal2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal2.proposal.id
      }
    });

    const proposal3Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal3.proposal.id
      }
    });

    expect(proposal1Notification).toBeTruthy();
    expect(proposal2Notification).toBeFalsy();
    expect(proposal3Notification).toBeFalsy();

    // Should not send notification again
    await sendDraftProposalNotificationTask();

    const proposal1NotificationsCount = await prisma.proposalNotification.count({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal1.proposal.id
      }
    });

    expect(proposal1NotificationsCount).toBe(1);
  });
});
