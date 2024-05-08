import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';

import { issueOffchainProposalCredentialsIfNecessary } from 'lib/credentials/issueOffchainProposalCredentialsIfNecessary';
import { publishProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ReviewEvaluationRequest = {
  decidedBy: string;
  proposalId: string;
  evaluationId: string;
  result: ProposalEvaluationResult;
};

export async function submitEvaluationResult({
  decidedBy,
  evaluationId,
  proposalId,
  workflowId,
  result,
  spaceId,
  evaluation
}: ReviewEvaluationRequest & {
  spaceId: string;
  workflowId: string;
  evaluation: { type: string; title: string };
}) {
  const workflow = await prisma.proposalWorkflow.findUniqueOrThrow({
    where: {
      id: workflowId
    },
    select: {
      evaluations: true
    }
  });

  const workflowEvaluation = (workflow.evaluations as WorkflowEvaluationJson[]).find(
    (e) => e.type === evaluation.type && e.title === evaluation.title
  );
  const requiredReviews = workflowEvaluation?.requiredReviews ?? 1;
  const existingEvaluationReviews = await prisma.proposalEvaluationReview.findMany({
    where: {
      evaluationId
    }
  });

  if (requiredReviews !== 1) {
    await prisma.proposalEvaluationReview.create({
      data: {
        evaluationId,
        result,
        reviewerId: decidedBy
      }
    });
  }

  if (existingEvaluationReviews.length + 1 === requiredReviews) {
    const totalPassed =
      existingEvaluationReviews.filter((r) => r.result === 'pass').length + (result === 'pass' ? 1 : 0);
    const totalFailed =
      existingEvaluationReviews.filter((r) => r.result === 'fail').length + (result === 'fail' ? 1 : 0);
    const finalResult = totalPassed > totalFailed ? 'pass' : 'fail';

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

    if (finalResult === 'pass') {
      await issueOffchainProposalCredentialsIfNecessary({
        event: 'proposal_approved',
        proposalId
      });
    }
  }
}
