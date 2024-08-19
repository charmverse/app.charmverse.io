import { prisma } from '@charmverse/core/prisma-client';
import { relay } from '@root/lib/websockets/relay';

import { UnauthorisedActionError } from 'lib/utils/errors';

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
    select: { archivedByAdmin: true, spaceId: true }
  });

  const actorRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId: proposal.spaceId,
      userId: actorId
    }
  });

  if (proposal.archivedByAdmin && !actorRole?.isAdmin) {
    throw new UnauthorisedActionError('Only admins can unarchive this proposal');
  }

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: proposalIds
      }
    },
    data: {
      archived,
      // remember if this was set by an admin, so that authors cannot un-archive
      archivedByAdmin: archived ? actorRole?.isAdmin : false
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
