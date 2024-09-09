import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateUserAndSpace } from '@root/testing/setupDatabase';
import { generateProposalWorkflow } from '@root/testing/utils/proposals';

import { sendDraftProposalNotificationTask } from '../sendDraftProposalNotificationTask';

describe('sendDraftProposalNotificationTask', () => {
  it('Should send draft proposal notifications for draft proposals and when workflow has draftReminder turned on', async () => {
    const { space, user } = await generateUserAndSpace();
    const workflow = await generateProposalWorkflow({
      spaceId: space.id,
      draftReminder: true,
      evaluations: [
        {
          type: 'feedback'
        }
      ]
    });

    const draftProposal1 = await testUtilsProposals.generateProposal({
      authors: [user.id],
      workflowId: workflow.id,
      proposalStatus: 'draft',
      userId: user.id,
      spaceId: space.id,
      pageType: 'proposal'
    });

    const draftProposal2 = await testUtilsProposals.generateProposal({
      authors: [user.id],
      workflowId: workflow.id,
      proposalStatus: 'published',
      userId: user.id,
      spaceId: space.id,
      pageType: 'proposal'
    });

    // Created just now so it should not have a notification
    const draftProposal3 = await testUtilsProposals.generateProposal({
      authors: [user.id],
      workflowId: workflow.id,
      proposalStatus: 'draft',
      userId: user.id,
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
        proposalId: draftProposal1.id
      }
    });

    const proposal2Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal2.id
      }
    });

    const proposal3Notification = await prisma.proposalNotification.findFirst({
      where: {
        type: 'draft_reminder',
        proposalId: draftProposal3.id
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
        proposalId: draftProposal1.id
      }
    });

    expect(proposal1NotificationsCount).toBe(1);
  });

  it('Should delete empty draft proposals', async () => {
    const { space, user } = await generateUserAndSpace();

    const workflow = await generateProposalWorkflow({
      spaceId: space.id,
      draftReminder: false, // set to false to make sure we still delete drafts
      evaluations: [
        {
          type: 'feedback'
        }
      ]
    });
    const p = await prisma.proposal.findMany({
      where: {
        spaceId: space.id
      }
    });

    // include a second author, to test that the proposal is deleted even if it has multiple authors
    const author2 = await testUtilsUser.generateUser();

    const emptyDraft = await testUtilsProposals.generateProposal({
      authors: [user.id, author2.id],
      proposalStatus: 'draft',
      userId: user.id,
      spaceId: space.id,
      title: '',
      workflowId: workflow.id
    });

    const draftWithContent = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'draft',
      title: 'my RPC proposal',
      userId: user.id,
      spaceId: space.id,
      workflowId: workflow.id
    });

    const p2 = await prisma.proposal.findMany({
      where: {
        spaceId: space.id
      }
    });

    await prisma.page.updateMany({
      where: {
        id: {
          in: [emptyDraft.page.id, draftWithContent.page.id]
        }
      },
      data: {
        // 25 hours ago
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
      }
    });

    const result = await sendDraftProposalNotificationTask();

    expect(result.deletedCount).toBe(1);

    const proposals = await prisma.proposal.findMany({
      where: {
        spaceId: space.id
      },
      select: { id: true }
    });
    expect(proposals.map((_p) => _p.id)).toEqual([draftWithContent.id]);

    const pages = await prisma.page.findMany({
      where: {
        spaceId: space.id
      },
      select: { id: true }
    });
    expect(pages.map((__p) => __p.id)).toEqual([draftWithContent.page.id]);
  });
});
