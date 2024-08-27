import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';

import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalWorkflow } from 'testing/utils/proposals';

import { getUserProposals } from '../getUserProposals';

describe('getUserProposals()', () => {
  it('Should fetch authored proposals for the user', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });

    const draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'draft'
    });
    const publishedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published'
    });
    const proposalAuthorProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalAuthor.id
    });

    expect(proposalAuthorProposals.actionable).toStrictEqual([]);
    expect(proposalAuthorProposals.authored.map((p) => p.id).sort()).toStrictEqual(
      [draftProposal.id, publishedProposal.id].sort()
    );
    expect(proposalAuthorProposals.assigned).toStrictEqual([]);
  });

  it('Should fetch assigned proposals for the user based on userId, roleId and space_member association', async () => {
    const { space, user: spaceAdmin } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const reviewerRole = await generateRole({
      spaceId: space.id,
      createdBy: spaceAdmin.id,
      roleName: 'Reviewer',
      assigneeUserIds: [proposalReviewer.id]
    });

    const spaceMemberReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          title: 'Vote',
          reviewers: [
            {
              group: 'space_member'
            }
          ],
          permissions: []
        }
      ]
    });
    // Creating vote manually since the test util doesn't support it
    // Vote on the proposal to make it non-actionable
    await prisma.vote.create({
      data: {
        pageId: spaceMemberReviewerProposal.page.id,
        spaceId: space.id,
        createdBy: proposalAuthor.id,
        deadline: new Date(),
        status: 'InProgress',
        threshold: 1,
        title: 'Vote',
        evaluation: {
          connect: {
            id: spaceMemberReviewerProposal.evaluations[0].id
          }
        },
        userVotes: {
          create: {
            userId: proposalReviewer.id
          }
        }
      }
    });
    const roleReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          title: 'Rubric',
          reviewers: [
            {
              group: 'role',
              id: reviewerRole.id
            }
          ],
          permissions: []
        },
        {
          evaluationType: 'pass_fail',
          title: 'Pass Fail 2',
          reviewers: [
            {
              group: 'user',
              id: spaceAdmin.id
            }
          ],
          permissions: []
        }
      ]
    });
    const userReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass Fail',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        }
      ]
    });
    // Submit evaluation result to make it non-actionable
    await prisma.proposalEvaluationReview.create({
      data: {
        result: 'pass',
        evaluationId: userReviewerProposal.evaluations[0].id,
        reviewerId: proposalReviewer.id
      }
    });
    // Submit evaluation result (by non reviewer) to make it non-actionable
    await prisma.proposalEvaluationReview.create({
      data: {
        result: 'pass',
        evaluationId: roleReviewerProposal.evaluations[0].id,
        reviewerId: proposalReviewer.id
      }
    });
    await prisma.proposalEvaluation.update({
      where: {
        id: roleReviewerProposal.evaluations[0].id
      },
      data: {
        result: 'pass',
        decidedBy: proposalReviewer.id,
        completedAt: new Date()
      }
    });

    const proposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalReviewer.id
    });

    expect(proposals.actionable).toStrictEqual([]);
    expect(proposals.authored).toStrictEqual([]);
    expect(proposals.assigned.map((p) => p.id).sort()).toStrictEqual(
      [spaceMemberReviewerProposal.id, roleReviewerProposal.id, userReviewerProposal.id].sort()
    );
  });

  it('Should fetch actionable proposals for the user based on userId, roleId and space_member association', async () => {
    const { space, user: spaceAdmin } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalAppealReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const reviewerRole = await generateRole({
      spaceId: space.id,
      createdBy: spaceAdmin.id,
      roleName: 'Reviewer',
      assigneeUserIds: [proposalReviewer.id]
    });

    const spaceMemberReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          title: 'Vote',
          reviewers: [
            {
              group: 'space_member'
            }
          ],
          permissions: []
        }
      ]
    });

    const roleReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          title: 'Rubric',
          reviewers: [
            {
              group: 'role',
              id: reviewerRole.id
            }
          ],
          permissions: []
        }
      ]
    });

    const userReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass Fail',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        }
      ]
    });

    const userAppealReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass Fail',
          appealReviewers: [
            {
              group: 'user',
              id: proposalAppealReviewer.id
            }
          ],
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        }
      ]
    });

    await prisma.proposalEvaluation.update({
      where: {
        id: userAppealReviewerProposal.evaluations[0].id
      },
      data: {
        appealedAt: new Date()
      }
    });

    await prisma.proposalEvaluationReview.create({
      data: {
        result: 'pass',
        evaluationId: userAppealReviewerProposal.evaluations[0].id,
        reviewerId: proposalReviewer.id
      }
    });

    const proposalReviewerProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalReviewer.id
    });

    const proposalAppealReviewerProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalAppealReviewer.id
    });

    expect(proposalReviewerProposals.actionable.map((p) => p.id).sort()).toStrictEqual(
      [userReviewerProposal.id, roleReviewerProposal.id, spaceMemberReviewerProposal.id].sort()
    );
    expect(proposalAppealReviewerProposals.actionable.map((p) => p.id).sort()).toStrictEqual(
      [userAppealReviewerProposal.id, spaceMemberReviewerProposal.id].sort()
    );
  });

  it('Should hide evaluation details for private evaluations unless the user is a reviewer', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });

    const workflow = await generateProposalWorkflow({
      spaceId: space.id
    });

    await prisma.proposalWorkflow.update({
      where: {
        id: workflow.id
      },
      data: {
        privateEvaluations: true
      }
    });

    await testUtilsProposals.generateProposal({
      spaceId: space.id,
      workflowId: workflow.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          title: 'Rubric',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        }
      ]
    });

    const proposalAuthorProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalAuthor.id
    });

    const proposalReviewerProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalReviewer.id
    });

    expect(proposalAuthorProposals.authored[0].currentEvaluation).toBeUndefined();
    expect(proposalReviewerProposals.actionable[0].currentEvaluation).toBeDefined();
  });
});
