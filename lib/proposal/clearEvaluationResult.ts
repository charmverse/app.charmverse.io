import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export type ClearEvaluationResultRequest = {
  proposalId: string;
  evaluationId: string;
};

// clear the result of a proposal evaluation and all evaluations after it
export async function clearEvaluationResult({ evaluationId, proposalId }: ClearEvaluationResultRequest) {
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

  // Also reset all evaluations after this one
  const evaluationsToReset = proposal.evaluations.slice(evaluationIndex).filter((e) => e.result !== null);

  if (evaluationsToReset.some((evaluation) => evaluation.type === 'vote')) {
    throw new InvalidInputError('Cannot clear the results of a vote');
  }
  log.debug('Clearing the result of proposal evaluation', {
    evaluationId,
    proposalId,
    stepsCleared: evaluationsToReset.length
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
      completedAt: null
    }
  });
}
