import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { createVote } from 'testing/setupDatabase';

import { clearEvaluationResult } from '../clearEvaluationResult';

describe('clearEvaluationResult()', () => {
  it('should clear the result from a feedback step', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await clearEvaluationResult({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        },
        rewards: true
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[0].result).toBe(null);
  });

  it('should delete the vote from an active vote step when', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          result: 'pass',
          reviewers: [],
          permissions: []
        },
        {
          evaluationType: 'vote',
          title: 'Vote step',
          reviewers: [],
          permissions: []
        }
      ]
    });

    const voteStep = proposal.evaluations.find((evaluation) => evaluation.type === 'vote');
    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id,
      pageId: proposal.page.id
    });
    await prisma.proposalEvaluation.update({
      where: {
        id: voteStep.id
      },
      data: { voteId: vote.id }
    });

    await clearEvaluationResult({
      proposalId: proposal.id,
      // go back to 'feedback' step
      evaluationId: proposal.evaluations[1].id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        },
        rewards: true
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[1].voteId).toBe(null);
    const voteExists = await prisma.vote.count({
      where: {
        id: vote.id
      }
    });
    expect(voteExists).toBe(0);
  });
  it('should delete the vote from an active vote step when going backward', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          result: 'pass',
          reviewers: [],
          permissions: []
        },
        {
          evaluationType: 'vote',
          title: 'Vote step',
          reviewers: [],
          permissions: []
        }
      ]
    });

    const voteStep = proposal.evaluations.find((evaluation) => evaluation.type === 'vote');
    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id,
      pageId: proposal.page.id
    });
    await prisma.proposalEvaluation.update({
      where: {
        id: voteStep.id
      },
      data: { voteId: vote.id }
    });

    await clearEvaluationResult({
      proposalId: proposal.id,
      // go back to 'feedback' step
      evaluationId: proposal.evaluations[0].id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        },
        rewards: true
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[1].voteId).toBe(null);
    const voteExists = await prisma.vote.count({
      where: {
        id: vote.id
      }
    });
    expect(voteExists).toBe(0);
  });
});
