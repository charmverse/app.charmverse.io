import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { relay } from 'lib/websockets/relay';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { getVoteEvaluationStepsWithBlockNumber } from './getVoteEvaluationStepsWithBlockNumber';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export async function publishProposal({ proposalId, userId }: { proposalId: string; userId: string }) {
  const result = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: 'published'
    },
    include: {
      page: {
        select: {
          type: true
        }
      },
      evaluations: true
    }
  });

  await setPageUpdatedAt({ proposalId, userId });

  const updatedEvaluations = await getVoteEvaluationStepsWithBlockNumber({
    evaluations: result.evaluations,
    isDraft: false,
    proposalType: result.page?.type ?? 'proposal'
  });

  await Promise.all(
    updatedEvaluations.map((evaluation) =>
      prisma.proposalEvaluation.update({
        where: {
          id: evaluation.id
        },
        data: {
          voteSettings: evaluation.voteSettings as Prisma.InputJsonValue
        }
      })
    )
  );

  await createVoteIfNecessary({
    createdBy: userId,
    proposalId
  });

  relay.broadcast(
    {
      type: 'proposals_updated',
      payload: [
        {
          id: proposalId,
          currentStep: getCurrentStep({
            evaluations: result.evaluations,
            hasPendingRewards: ((result.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
            proposalStatus: result.status,
            hasPublishedRewards: false
          })
        }
      ]
    },
    result.spaceId
  );
}
