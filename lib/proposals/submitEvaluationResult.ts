import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
  failReasons?: string[];
};

export async function submitEvaluationResult({
  decidedBy,
  evaluationId,
  proposalId,
  result,
  spaceId,
  failReasons
}: ReviewEvaluationRequest & {
  spaceId: string;
}) {
  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      result,
      decidedBy,
      completedAt: new Date(),
      failReasons
    }
  });

  await setPageUpdatedAt({ proposalId, userId: decidedBy });

  // determine if we should create vote for the next stage
  if (result === 'pass') {
    await createVoteIfNecessary({
      createdBy: decidedBy,
      proposalId
    });
  }

  await publishProposalEvent({
    currentEvaluationId: evaluationId,
    proposalId,
    spaceId,
    userId: decidedBy
  });
}
