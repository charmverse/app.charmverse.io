import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { isTruthy } from '@packages/lib/utils/types';
import { generateRole, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateProposalWorkflow } from '@root/lib/testing/proposals';

import { getUserProposals } from '../getUserProposals';

describe('getUserProposals() - authored', () => {
  it('Should fetch authored proposals for the user without any hidden evaluation, ignoring archived proposals', async () => {
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
    const publishedArchivedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      archived: true
    });
    const proposalAuthorProposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalAuthor.id
    });
    expect(proposalAuthorProposals.actionable).toStrictEqual([]);
    expect(proposalAuthorProposals.authored.map((p) => p.id).sort()).toStrictEqual(
      [draftProposal.id, publishedProposal.id].sort()
    );
    expect(proposalAuthorProposals.review_completed).toStrictEqual([]);
  });

  it('Should fetch authored proposals for the user with hidden evaluation', async () => {
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

    const publishedProposal = await testUtilsProposals.generateProposal({
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
    expect(proposalAuthorProposals.actionable).toStrictEqual([]);
    expect(proposalAuthorProposals.review_completed).toStrictEqual([]);
    expect(proposalAuthorProposals.authored.map((p) => p.id)).toStrictEqual([publishedProposal.id]);
    expect(proposalAuthorProposals.authored[0].currentEvaluation).toBeUndefined();
  });
});

describe('getUserProposals() - actionable', () => {
  it('Should fetch actionable proposals for the reviewer of proposals', async () => {
    const { space, user: spaceAdmin } = await generateUserAndSpace({
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

    const spaceMemberReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      workflowId: workflow.id,
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

    const reviewerRole = await generateRole({
      spaceId: space.id,
      createdBy: spaceAdmin.id,
      roleName: 'Reviewer',
      assigneeUserIds: [proposalReviewer.id]
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

    const roleReviewerArchivedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      archived: true,
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

    const proposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalReviewer.id
    });

    expect(proposals.review_completed).toStrictEqual([]);
    expect(proposals.authored).toStrictEqual([]);
    expect(proposals.actionable.map((p) => p.id).sort()).toStrictEqual(
      [spaceMemberReviewerProposal.id, roleReviewerProposal.id, userReviewerProposal.id].sort()
    );
    expect(proposals.actionable.map((p) => p.currentEvaluation).filter(isTruthy).length).toBe(3);
  });

  it('Should fetch actionable proposals for the appeal reviewers of proposals', async () => {
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

    const appealReviewerRole = await generateRole({
      spaceId: space.id,
      roleName: 'Reviewer',
      assigneeUserIds: [proposalReviewer.id],
      createdBy: spaceAdmin.id
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

    const userReviewerProposal = await testUtilsProposals.generateProposal({
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
              id: appealReviewerRole.id
            }
          ],
          permissions: []
        }
      ]
    });

    await Promise.all([
      prisma.proposalAppealReviewer.create({
        data: {
          proposalId: userReviewerProposal.id,
          userId: proposalAppealReviewer.id,
          evaluationId: userReviewerProposal.evaluations[0].id
        }
      }),
      prisma.proposalAppealReviewer.create({
        data: {
          proposalId: roleReviewerProposal.id,
          userId: proposalAppealReviewer.id,
          evaluationId: roleReviewerProposal.evaluations[0].id
        }
      }),
      prisma.proposalEvaluation.update({
        where: {
          id: userReviewerProposal.evaluations[0].id
        },
        data: {
          appealedAt: new Date()
        }
      }),
      prisma.proposalEvaluation.update({
        where: {
          id: roleReviewerProposal.evaluations[0].id
        },
        data: {
          appealedAt: new Date()
        }
      })
    ]);

    const proposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalAppealReviewer.id
    });

    expect(proposals.review_completed).toStrictEqual([]);
    expect(proposals.authored).toStrictEqual([]);
    expect(proposals.actionable.map((p) => p.id).sort()).toStrictEqual(
      [userReviewerProposal.id, roleReviewerProposal.id].sort()
    );
    expect(proposals.actionable.map((p) => p.currentEvaluation).filter(isTruthy).length).toBe(2);
  });

  it('Should fetch actionable proposals for the approvers', async () => {
    const { space, user: spaceAdmin } = await generateUserAndSpace({
      isAdmin: false
    });

    const [proposalAuthor, proposalReviewer1, proposalReviewer2, proposalApprover] = await Promise.all([
      generateSpaceUser({
        spaceId: space.id
      }),
      generateSpaceUser({
        spaceId: space.id
      }),
      generateSpaceUser({
        spaceId: space.id
      }),
      generateSpaceUser({
        spaceId: space.id
      })
    ]);

    const workflow = await generateProposalWorkflow({
      spaceId: space.id
    });

    const approverRole = await generateRole({
      spaceId: space.id,
      roleName: 'Approver',
      assigneeUserIds: [proposalApprover.id],
      createdBy: spaceAdmin.id
    });

    await prisma.proposalWorkflow.update({
      where: {
        id: workflow.id
      },
      data: {
        privateEvaluations: true
      }
    });

    const userApproverProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      workflowId: workflow.id,
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
              id: proposalReviewer1.id
            },
            {
              group: 'user',
              id: proposalReviewer2.id
            }
          ],
          permissions: []
        }
      ]
    });

    const roleApproverProposal = await testUtilsProposals.generateProposal({
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
              id: proposalReviewer1.id
            },
            {
              group: 'user',
              id: proposalReviewer2.id
            }
          ],
          permissions: []
        }
      ]
    });

    await Promise.all([
      prisma.proposalEvaluationApprover.create({
        data: {
          proposalId: userApproverProposal.id,
          userId: proposalApprover.id,
          evaluationId: userApproverProposal.evaluations[0].id
        }
      }),
      prisma.proposalEvaluationApprover.create({
        data: {
          proposalId: roleApproverProposal.id,
          roleId: approverRole.id,
          evaluationId: roleApproverProposal.evaluations[0].id
        }
      }),
      prisma.proposalEvaluation.update({
        where: {
          id: userApproverProposal.evaluations[0].id
        },
        data: {
          requiredReviews: 2
        }
      }),
      prisma.proposalEvaluationReview.create({
        data: {
          result: 'pass',
          evaluationId: userApproverProposal.evaluations[0].id,
          reviewerId: proposalReviewer1.id
        }
      }),
      prisma.proposalEvaluationReview.create({
        data: {
          result: 'pass',
          evaluationId: userApproverProposal.evaluations[0].id,
          reviewerId: proposalReviewer2.id
        }
      }),
      prisma.proposalEvaluationReview.create({
        data: {
          result: 'pass',
          evaluationId: roleApproverProposal.evaluations[0].id,
          reviewerId: proposalReviewer1.id
        }
      })
    ]);

    const proposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalApprover.id
    });

    expect(proposals.review_completed).toStrictEqual([]);
    expect(proposals.authored).toStrictEqual([]);
    expect(proposals.actionable.map((p) => p.id).sort()).toStrictEqual(
      [userApproverProposal.id, roleApproverProposal.id].sort()
    );
    expect(proposals.actionable.map((p) => p.currentEvaluation).filter(isTruthy).length).toBe(2);
  });
});

describe('getUserProposals() - review_completed', () => {
  it('Should fetch assigned proposals for the reviewer of proposals', async () => {
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
          evaluationType: 'rubric',
          title: 'Rubric',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: [],
          rubricCriteria: [
            {
              parameters: { min: 1, max: 5 },
              title: 'Rubric Criteria'
            }
          ]
        }
      ]
    });

    const rubricCriteria = await prisma.proposalRubricCriteria.findFirstOrThrow({
      where: {
        proposalId: userReviewerProposal.id
      }
    });

    // Submit evaluation result to make it non-actionable
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        proposalId: userReviewerProposal.id,
        response: { score: 5 },
        rubricCriteriaId: rubricCriteria.id,
        userId: proposalReviewer.id,
        evaluationId: userReviewerProposal.evaluations[0].id
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
    expect(proposals.review_completed.map((p) => p.id).sort()).toStrictEqual(
      [spaceMemberReviewerProposal.id, roleReviewerProposal.id, userReviewerProposal.id].sort()
    );
  });

  it('Does not include an assigned proposal that is not yet active', async () => {
    const { space, user: spaceAdmin } = await generateUserAndSpace({
      isAdmin: false
    });

    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });

    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });

    const userReviewerProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Feedback',
          reviewers: [
            {
              group: 'user',
              id: proposalAuthor.id
            }
          ],
          permissions: [],
          rubricCriteria: [
            {
              parameters: { min: 1, max: 5 },
              title: 'Rubric Criteria'
            }
          ]
        },
        {
          evaluationType: 'pass_fail',
          title: 'Pass/Fail',
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

    const proposals = await getUserProposals({
      spaceId: space.id,
      userId: proposalReviewer.id
    });

    expect(proposals.actionable).toStrictEqual([]);
    expect(proposals.authored).toStrictEqual([]);
    expect(proposals.review_completed.map((p) => p.id).sort()).toStrictEqual([]);
  });
});
