import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';

import { submitEvaluationAppealResult } from '../submitEvaluationAppealResult';
import { submitEvaluationResult } from '../submitEvaluationResult';

describe('submitEvaluationAppealResult()', () => {
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
          appealable: true,
          appealedAt: new Date(),
          appealedBy: user.id,
          appealRequiredReviews: 1,
          permissions: []
        }
      ]
    });

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId
      },
      include: {
        reviews: true,
        appealReviews: true
      }
    });

    const evaluation = proposalEvaluations[0];

    await submitEvaluationResult({
      decidedBy: user.id,
      evaluation,
      proposalId,
      result: 'fail',
      spaceId: space.id
    });

    const evaluationAfterUpdate = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      }
    });

    expect(evaluationAfterUpdate.result).toBe('fail');

    await submitEvaluationAppealResult({
      decidedBy: user.id,
      evaluation,
      proposalId,
      result: 'pass',
      spaceId: space.id
    });

    const proposalEvaluationAppealReview = await prisma.proposalEvaluationAppealReview.findFirst({
      where: {
        evaluationId: evaluation.id,
        result: 'pass'
      }
    });

    const evaluationAfterAppeal = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluation.id
      }
    });

    expect(evaluationAfterAppeal.result).toBe('pass');
    expect(evaluationAfterAppeal.decidedBy).toBe(user.id);
    expect(proposalEvaluationAppealReview).toBeTruthy();
  });
});
