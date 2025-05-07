import { prisma } from '@charmverse/core/prisma-client';
import { relay } from 'lib/websockets/relay';

import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ArchiveProposalRequest = {
  archived: boolean;
  proposalIds: string[];
};

export async function archiveProposals({
  archived,
  proposalIds,
  actorId
}: ArchiveProposalRequest & { actorId: string }) {
  if (proposalIds.length === 0) {
    return;
  }
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      id: proposalIds[0]
    },
    select: { spaceId: true }
  });

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: proposalIds
      }
    },
    data: {
      archived
    }
  });

  for (const proposalId of proposalIds) {
    await setPageUpdatedAt({ proposalId, userId: actorId });
  }

  relay.broadcast(
    {
      type: 'proposals_updated',
      payload: proposalIds.map((id) => ({ id, archived }))
    },
    proposal.spaceId
  );
}
