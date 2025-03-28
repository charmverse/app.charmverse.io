import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateRole, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';

import { getProposalsReviewers } from '../getProposalsReviewers';

describe('getProposalsReviewers()', () => {
  it('Should fetch proposals for reviewers', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const publishedProposal = await testUtilsProposals.generateProposal({
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
          permissions: []
        }
      ]
    });
    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });
    expect(proposalsReviewers.length).toBe(1);
    expect(proposalsReviewers[0].userId).toBe(proposalReviewer.id);
    expect(proposalsReviewers[0].reviewsLeft).toBe(1);
    expect(proposalsReviewers[0].proposals.length).toBe(1);
    expect(proposalsReviewers[0].proposals[0].id).toBe(publishedProposal.id);
  });

  it('Should fetch proposals for space member reviewers', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const publishedProposal = await testUtilsProposals.generateProposal({
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
    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });
    expect(proposalsReviewers.length).toBe(3); // Author, reviewer and admin
  });

  it('Should fetch proposals for role-based reviewers', async () => {
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
    const publishedProposal = await testUtilsProposals.generateProposal({
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
    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });
    expect(proposalsReviewers.length).toBe(1);
    expect(proposalsReviewers[0].userId).toBe(proposalReviewer.id);
    expect(proposalsReviewers[0].reviewsLeft).toBe(1);
    expect(proposalsReviewers[0].proposals.length).toBe(1);
    expect(proposalsReviewers[0].proposals[0].id).toBe(publishedProposal.id);
  });

  it('Should not include completed reviews in reviewsLeft', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const publishedProposal = await testUtilsProposals.generateProposal({
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
        proposalId: publishedProposal.id
      }
    });

    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        proposalId: publishedProposal.id,
        response: { score: 5 },
        rubricCriteriaId: rubricCriteria.id,
        userId: proposalReviewer.id,
        evaluationId: publishedProposal.evaluations[0].id
      }
    });

    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });
    expect(proposalsReviewers.length).toBe(1);
    expect(proposalsReviewers[0].userId).toBe(proposalReviewer.id);
    expect(proposalsReviewers[0].reviewsLeft).toBe(0);
    expect(proposalsReviewers[0].proposals.length).toBe(0);
  });

  it('Should not include proposals with completed evaluations', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer = await generateSpaceUser({
      spaceId: space.id
    });
    const publishedProposal = await testUtilsProposals.generateProposal({
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

    await prisma.proposalEvaluationReview.create({
      data: {
        result: 'pass',
        evaluationId: publishedProposal.evaluations[0].id,
        reviewerId: proposalReviewer.id
      }
    });

    await prisma.proposalEvaluation.update({
      where: {
        id: publishedProposal.evaluations[0].id
      },
      data: {
        result: 'pass',
        decidedBy: proposalReviewer.id,
        completedAt: new Date()
      }
    });

    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });
    expect(proposalsReviewers.length).toBe(0);
  });

  it('Should sort reviewers by reviewsLeft and then by reviewsCompleted', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: false
    });
    const proposalAuthor = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer1 = await generateSpaceUser({
      spaceId: space.id
    });
    const proposalReviewer2 = await generateSpaceUser({
      spaceId: space.id
    });

    // Create two proposals for reviewer1 and one for reviewer2
    await testUtilsProposals.generateProposal({
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
              id: proposalReviewer1.id
            }
          ],
          permissions: []
        }
      ]
    });

    await testUtilsProposals.generateProposal({
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
              id: proposalReviewer1.id
            }
          ],
          permissions: []
        }
      ]
    });

    await testUtilsProposals.generateProposal({
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
              id: proposalReviewer2.id
            }
          ],
          permissions: []
        }
      ]
    });

    const proposalsReviewers = await getProposalsReviewers({
      spaceId: space.id
    });

    expect(proposalsReviewers.length).toBe(2);
    expect(proposalsReviewers[0].userId).toBe(proposalReviewer1.id);
    expect(proposalsReviewers[0].reviewsLeft).toBe(2);
    expect(proposalsReviewers[1].userId).toBe(proposalReviewer2.id);
    expect(proposalsReviewers[1].reviewsLeft).toBe(1);
  });
});
