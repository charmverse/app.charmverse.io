import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';
import { getDraftStep } from '@root/lib/proposals/getCurrentStep';
import { publishProposalEvent } from '@root/lib/webhookPublisher/publishEvent';
import { relay } from '@root/lib/websockets/relay';

import { setPageUpdatedAt } from './setPageUpdatedAt';

export type GoBackToStepRequest = {
  proposalId: string;
  evaluationId: string | 'draft';
};

// clear the result of a proposal evaluation and all evaluations after it
export async function goBackToStep({
  userId,
  evaluationId: maybeEvaluationId,
  proposalId
}: GoBackToStepRequest & {
  userId: string;
}) {
  const evaluationId = maybeEvaluationId === 'draft' ? null : maybeEvaluationId;
  const backToDraft = !evaluationId;

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      archived: true,
      spaceId: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      },
      rewards: true
    }
  });

  if (proposal.archived) {
    throw new InvalidInputError('Cannot clear the results of an archived proposal');
  }

  if (proposal.rewards.length > 0) {
    throw new InvalidInputError('Cannot clear the results of a proposal with published rewards');
  }

  let evaluationIndex = 0;

  if (evaluationId) {
    evaluationIndex = proposal.evaluations.findIndex((e) => e.id === evaluationId);

    if (evaluationIndex < 0) {
      throw new Error('Evaluation not found');
    }

    const evaluation = proposal.evaluations[evaluationIndex];

    if (!evaluation.result) {
      log.debug('No proposal result to clear', { proposalId, evaluationId, voteId: evaluation.voteId });
      return;
    }
  }

  const evaluationsToUpdate = proposal.evaluations.slice(evaluationIndex);
  const evaluationIds = evaluationsToUpdate.map((e) => e.id);
  const evaluationsWithResult = evaluationsToUpdate.filter((e) => e.result);

  if (evaluationsWithResult.some((e) => e.type === 'vote')) {
    throw new InvalidInputError('Cannot clear the results of a vote');
  }

  log.debug('Clearing the result of proposal evaluation', {
    evaluationId,
    backToDraft,
    proposalId,
    stepsToClear: evaluationIds.length
  });

  await prisma.$transaction([
    prisma.proposalEvaluationReview.deleteMany({
      where: {
        evaluationId: {
          in: evaluationIds
        }
      }
    }),
    prisma.proposalEvaluationAppealReview.deleteMany({
      where: {
        evaluationId: {
          in: evaluationIds
        }
      }
    }),
    prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: evaluationIds
        }
      },
      data: {
        result: null,
        decidedBy: null,
        completedAt: null,
        voteId: null,
        appealReason: null,
        appealedAt: null
      }
    })
  ]);

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

  if (backToDraft) {
    const result = await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        publishedAt: null,
        status: 'draft'
      }
    });

    relay.broadcast(
      {
        type: 'proposals_updated',
        payload: [
          {
            id: proposalId,
            currentStep: getDraftStep()
          }
        ]
      },
      result.spaceId
    );
  } else {
    await publishProposalEvent({
      currentEvaluationId: maybeEvaluationId,
      proposalId,
      spaceId: proposal.spaceId,
      userId
    });
  }

  await setPageUpdatedAt({ proposalId, userId });
}
