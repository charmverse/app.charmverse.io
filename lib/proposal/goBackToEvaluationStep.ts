import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

export type GoBackToEvaluationStepRequest = {
  proposalId: string;
  evaluationId?: string; // if not provided, clear all evaluations and go to draft status
};

// clear the result of a proposal evaluation and all evaluations after it
export async function goBackToEvaluationStep({ evaluationId, proposalId }: GoBackToEvaluationStepRequest) {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
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
  const evaluationIndex = proposal.evaluations.findIndex((e) => e.id === evaluationId);

  if (evaluationIndex < 0) {
    throw new Error('Evaluation not found');
  }

  if (proposal.rewards.length > 0) {
    throw new InvalidInputError('Cannot clear the results of a proposal with rewards');
  }

  const evaluation = proposal.evaluations[evaluationIndex];

  if (!evaluation.result) {
    log.debug('No proposal result to clear', { proposalId, evaluationId, voteId: evaluation.voteId });
    return;
  }

  const evaluationsToUpdate = proposal.evaluations.slice(evaluationIndex);

  const evaluationsToReset = evaluationsToUpdate.filter((e) => e.result);

  if (evaluationsToReset.some((e) => e.type === 'vote')) {
    throw new InvalidInputError('Cannot clear the results of a vote');
  }

  log.debug('Clearing the result of proposal evaluation', {
    evaluationId,
    proposalId,
    stepsToClear: evaluationsToReset.length
  });

  await prisma.proposalEvaluation.updateMany({
    where: {
      id: {
        in: evaluationsToReset.map((e) => e.id)
      }
    },
    data: {
      result: null,
      decidedBy: null,
      completedAt: null,
      voteId: null
    }
  });

  // clear out vote
  const votesToDelete = evaluationsToUpdate.map((e) => e.voteId).filter(isTruthy);
  for (const voteId of votesToDelete) {
    await prisma.vote.deleteMany({
      where: {
        id: voteId
      }
    });
    log.info('Cleared vote tied to proposal', { proposalId, evaluationId });
  }
}
