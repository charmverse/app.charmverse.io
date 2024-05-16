import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { issueOffchainProposalCredentialsIfNecessary } from 'lib/credentials/issueOffchainProposalCredentialsIfNecessary';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
  declineReasons?: string[];
};

export async function updateEvaluationResult({
  decidedBy,
  evaluationId,
  proposalId,
  result,
  spaceId,
  existingEvaluationReviews
}: {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result?: ProposalEvaluationResult;
  existingEvaluationReviews: { result: ProposalEvaluationResult }[];
  spaceId: string;
}) {
  const totalPassed = existingEvaluationReviews.filter((r) => r.result === 'pass').length + (result === 'pass' ? 1 : 0);
  const totalFailed = existingEvaluationReviews.filter((r) => r.result === 'fail').length + (result === 'fail' ? 1 : 0);
  const finalResult = totalPassed > totalFailed ? 'pass' : 'fail';

  if (finalResult !== 'pass') {
    return;
  }

  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      result: 'pass',
      decidedBy,
      completedAt: new Date()
    }
  });

  await createVoteIfNecessary({
    createdBy: decidedBy,
    proposalId
  });
  await issueOffchainProposalCredentialsIfNecessary({
    event: 'proposal_approved',
    proposalId
  });

  await setPageUpdatedAt({ proposalId, userId: decidedBy });
  await publishProposalEvent({
    currentEvaluationId: evaluationId,
    proposalId,
    spaceId,
    userId: decidedBy
  });
}

export async function submitEvaluationAppealResult({
  decidedBy,
  proposalId,
  result,
  spaceId,
  evaluation,
  declineReasons
}: Omit<ReviewEvaluationRequest, 'evaluationId'> & {
  spaceId: string;
  evaluation: {
    id: string;
    appealRequiredReviews: number | null;
    proposalEvaluationReviews: {
      result: ProposalEvaluationResult;
    }[];
  };
}) {
  const evaluationId = evaluation.id;
  const requiredAppealReviews = evaluation.appealRequiredReviews ?? 1;

  await prisma.proposalEvaluationReview.create({
    data: {
      evaluationId,
      result,
      reviewerId: decidedBy,
      declineReasons,
      appeal: true
    }
  });

  if (evaluation.proposalEvaluationReviews.length + 1 >= requiredAppealReviews) {
    await updateEvaluationResult({
      decidedBy,
      proposalId,
      evaluationId,
      result,
      spaceId,
      existingEvaluationReviews: evaluation.proposalEvaluationReviews
    });
  }
}
