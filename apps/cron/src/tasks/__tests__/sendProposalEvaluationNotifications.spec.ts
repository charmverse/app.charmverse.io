import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateRole, generateSpaceUser, generateUserAndSpace } from '@root/testing/setupDatabase';

import { sendProposalEvaluationNotifications } from '../sendProposalEvaluationNotifications';

describe('sendProposalEvaluationNotifications', () => {
  it('Should not send proposal notifications for evaluations past due date or existing notifications', async () => {
    const { space, user: adminUser } = await generateUserAndSpace();
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const evaluationInputs: testUtilsProposals.GenerateProposalInput['evaluationInputs'] = [
      {
        evaluationType: 'feedback',
        permissions: [],
        reviewers: [
          {
            group: 'user',
            id: proposalReviewer.id
          }
        ],
        dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000)
      }
    ] as const;

    const draftProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'draft',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs
    });
    const templateProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal_template',
      evaluationInputs
    });
    const archivedProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      archived: true,
      evaluationInputs
    });
    const incomingDueDateProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs: [
        {
          ...evaluationInputs[0],
          // 48 hours from now, but not yet past due
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      ]
    });
    const pastDueDateProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs: [
        {
          ...evaluationInputs[0],
          // 25 hours ago, past due
          dueDate: new Date(Date.now() - 25 * 60 * 60 * 1000)
        }
      ]
    });
    const existingNotificationProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs
    });
    await prisma.userNotificationMetadata.create({
      data: {
        proposalNotifications: {
          create: {
            proposalId: existingNotificationProposal.id,
            type: 'evaluation_reminder',
            evaluationId: existingNotificationProposal.evaluations[0].id
          }
        },
        userId: proposalReviewer.id,
        createdBy: adminUser.id,
        spaceId: space.id
      }
    });

    await sendProposalEvaluationNotifications(space.id);

    const draftProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        proposalId: draftProposal.id,
        type: 'evaluation_reminder',
        evaluationId: draftProposal.evaluations[0].id
      }
    });

    const templateProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        proposalId: templateProposal.id,
        type: 'evaluation_reminder',
        evaluationId: templateProposal.evaluations[0].id
      }
    });

    const archivedProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        proposalId: archivedProposal.id,
        type: 'evaluation_reminder',
        evaluationId: archivedProposal.evaluations[0].id
      }
    });

    const incomingDueDateProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        proposalId: incomingDueDateProposal.id,
        type: 'evaluation_reminder',
        evaluationId: incomingDueDateProposal.evaluations[0].id
      }
    });

    const pastDueDateProposalNotification = await prisma.proposalNotification.findFirst({
      where: {
        proposalId: pastDueDateProposal.id,
        type: 'evaluation_reminder',
        evaluationId: pastDueDateProposal.evaluations[0].id
      }
    });

    expect(draftProposalNotification).toBeNull();
    expect(templateProposalNotification).toBeNull();
    expect(archivedProposalNotification).toBeNull();
    expect(incomingDueDateProposalNotification).toBeNull();
    expect(pastDueDateProposalNotification).toBeNull();
  });

  it('Should send proposal notifications for evaluations due within 24 hours', async () => {
    const { space, user: adminUser } = await generateUserAndSpace();
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const role = await generateRole({
      spaceId: space.id,
      roleName: 'reviewer',
      assigneeUserIds: [proposalReviewer.id],
      createdBy: adminUser.id
    });

    const evaluationInputs: testUtilsProposals.GenerateProposalInput['evaluationInputs'] = [
      {
        evaluationType: 'feedback',
        permissions: [],
        reviewers: [
          {
            group: 'user',
            id: proposalReviewer.id
          }
        ],
        dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000)
      }
    ];

    const userIdReviewerProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs
    });

    const roleIdReviewerProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs: [
        {
          ...evaluationInputs[0],
          reviewers: [
            {
              group: 'role',
              id: role.id
            }
          ]
        }
      ]
    });

    const spaceMemberReviewerProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs: [
        {
          ...evaluationInputs[0],
          reviewers: [
            {
              group: 'space_member'
            }
          ]
        }
      ]
    });

    const authorReviewerProposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      userId: proposalAuthor.id,
      spaceId: space.id,
      pageType: 'proposal',
      evaluationInputs: [
        {
          ...evaluationInputs[0],
          reviewers: [
            {
              group: 'author'
            }
          ]
        }
      ]
    });

    await sendProposalEvaluationNotifications(space.id);

    const userIdReviewerProposalNotifications = await prisma.proposalNotification.count({
      where: {
        proposalId: userIdReviewerProposal.id,
        type: 'evaluation_reminder',
        evaluationId: userIdReviewerProposal.evaluations[0].id
      }
    });

    const roleIdReviewerProposalNotifications = await prisma.proposalNotification.count({
      where: {
        proposalId: roleIdReviewerProposal.id,
        type: 'evaluation_reminder',
        evaluationId: roleIdReviewerProposal.evaluations[0].id
      }
    });

    const spaceMemberReviewerProposalNotifications = await prisma.proposalNotification.count({
      where: {
        proposalId: spaceMemberReviewerProposal.id,
        type: 'evaluation_reminder',
        evaluationId: spaceMemberReviewerProposal.evaluations[0].id
      }
    });

    const authorReviewerProposalNotifications = await prisma.proposalNotification.count({
      where: {
        proposalId: authorReviewerProposal.id,
        type: 'evaluation_reminder',
        evaluationId: authorReviewerProposal.evaluations[0].id
      }
    });

    expect(userIdReviewerProposalNotifications).toBe(1);
    expect(roleIdReviewerProposalNotifications).toBe(1);
    expect(spaceMemberReviewerProposalNotifications).toBe(2);
    expect(authorReviewerProposalNotifications).toBe(1);
  });
});
