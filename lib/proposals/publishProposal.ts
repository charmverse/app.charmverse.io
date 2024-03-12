import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { relay } from 'lib/websockets/relay';

import { createVoteIfNecessary } from './createVoteIfNecessary';
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
      evaluations: true
    }
  });

  await setPageUpdatedAt({ proposalId, userId });

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
