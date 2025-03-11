import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';

import { submitEvaluationResult } from '../submitEvaluationResult';

describe('submitEvaluationResult()', () => {
  it('Should directly apply result when submitting evaluation result for pass_fail step with 1 required reviews', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });
    const { id: proposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass/Fail',
          reviewers: [
            {
              group: 'user',
              id: user.id
            }
          ],
          permissions: []
        }
      ]
    });

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId
      },
      include: {
        reviews: true
      }
    });

    const evaluation = proposalEvaluations[0];

    await submitEvaluationResult({
      decidedBy: user.id,
      evaluation,
      proposalId,
      result: 'pass',
      spaceId: space.id
    });

    const proposalEvaluationReview = await prisma.proposalEvaluationReview.findFirst({
      where: {
        evaluationId: evaluation.id
      }
    });

    expect(proposalEvaluationReview).toBeTruthy();
  });

  it('Should update result after users have submitted evaluation result for pass_fail step with > 1 required reviews', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });
    const user2 = await generateSpaceUser({
      spaceId: space.id
    });
    const user3 = await generateSpaceUser({
      spaceId: space.id
    });

    const { id: proposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass/Fail',
          reviewers: [
            {
              group: 'user',
              id: user.id
            },
            {
              group: 'user',
              id: user2.id
            },
            {
              group: 'user',
              id: user3.id
            }
          ],
          requiredReviews: 3,
          permissions: []
        }
      ]
    });

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId
      },
      include: {
        reviews: true
      }
    });

    const evaluation = proposalEvaluations[0];

    await submitEvaluationResult({
      decidedBy: user.id,
      evaluation,
      proposalId,
      result: 'pass',
      spaceId: space.id
    });

    const updatedEvaluation1 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      include: {
        reviews: true
      }
    });

    expect(updatedEvaluation1.result).toBeNull();

    await submitEvaluationResult({
      decidedBy: user2.id,
      evaluation: updatedEvaluation1,
      proposalId,
      result: 'fail',
      spaceId: space.id
    });

    const updatedEvaluation2 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      include: {
        reviews: true
      }
    });

    expect(updatedEvaluation2.result).toBeNull();

    await submitEvaluationResult({
      decidedBy: user3.id,
      evaluation: updatedEvaluation2,
      proposalId,
      result: 'fail',
      spaceId: space.id
    });

    const updatedEvaluation3 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      select: {
        result: true
      }
    });

    expect(updatedEvaluation3.result).toBe('fail');

    const proposalEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluationId: evaluation.id
      }
    });

    expect(proposalEvaluationReviews.length).toBe(3);
  });

  it('Should update result when  users have submitted evaluation result for pass_fail step with > 1 required reviews', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });
    const user2 = await generateSpaceUser({
      spaceId: space.id
    });
    const user3 = await generateSpaceUser({
      spaceId: space.id
    });

    const { id: proposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Pass/Fail',
          reviewers: [
            {
              group: 'user',
              id: user.id
            },
            {
              group: 'user',
              id: user2.id
            },
            {
              group: 'user',
              id: user3.id
            }
          ],
          requiredReviews: 3,
          permissions: []
        }
      ]
    });

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId
      },
      include: {
        reviews: true
      }
    });

    const evaluation = proposalEvaluations[0];

    await submitEvaluationResult({
      decidedBy: user.id,
      evaluation,
      proposalId,
      result: 'pass',
      spaceId: space.id
    });

    const updatedEvaluation1 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      include: {
        reviews: true
      }
    });

    expect(updatedEvaluation1.result).toBeNull();

    await submitEvaluationResult({
      decidedBy: user2.id,
      evaluation: updatedEvaluation1,
      proposalId,
      result: 'fail',
      spaceId: space.id
    });

    const updatedEvaluation2 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      include: {
        reviews: true
      }
    });

    expect(updatedEvaluation2.result).toBeNull();

    await submitEvaluationResult({
      decidedBy: user3.id,
      evaluation: updatedEvaluation2,
      proposalId,
      result: 'fail',
      spaceId: space.id
    });

    const updatedEvaluation3 = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      },
      select: {
        result: true
      }
    });

    expect(updatedEvaluation3.result).toBe('fail');

    const proposalEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
      where: {
        evaluationId: evaluation.id
      }
    });

    expect(proposalEvaluationReviews.length).toBe(3);
  });
});
