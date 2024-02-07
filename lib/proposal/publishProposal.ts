import { prisma } from '@charmverse/core/prisma-client';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export async function publishProposal({ proposalId, userId }: { proposalId: string; userId: string }) {
  await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: 'published'
    }
  });

  await setPageUpdatedAt({ proposalId, userId });

  await createVoteIfNecessary({
    createdBy: userId,
    proposalId
  });
}
