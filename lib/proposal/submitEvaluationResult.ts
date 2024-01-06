import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createVoteIfNecessary } from './createVoteIfNecessary';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
};

export async function submitEvaluationResult({ decidedBy, evaluationId, proposalId, result }: ReviewEvaluationRequest) {
  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      result,
      decidedBy,
      completedAt: new Date()
    }
  });
  // determine if we should create vote for the next stage
  if (result === 'pass') {
    await createVoteIfNecessary({
      createdBy: decidedBy,
      proposalId
    });
  }
}
