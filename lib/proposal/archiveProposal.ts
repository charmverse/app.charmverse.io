import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { relay } from 'lib/websockets/relay';

import { setPageUpdatedAt } from './setPageUpdatedAt';

export type ArchiveProposalRequest = {
  archived: boolean;
  proposalId: string;
};

export async function archiveProposal({ archived, proposalId, actorId }: ArchiveProposalRequest & { actorId: string }) {
  if (typeof archived !== 'boolean') {
    throw new InvalidInputError(`Property "archived" must be true or false`);
  } else if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Proposal ID must be a valid proposal ID`);
  }

  const updatedProposal = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      archived
    }
  });

  await setPageUpdatedAt({ proposalId, userId: actorId });
  relay.broadcast(
    {
      type: 'proposals_archived',
      payload: {
        archived,
        proposalIds: [proposalId]
      }
    },
    updatedProposal.spaceId
  );

  return updatedProposal;
}
