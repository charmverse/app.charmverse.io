import { Proposal, ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { MissingDataError } from 'lib/utilities/errors';
import { proposalStatusTransitionRecord } from './proposalStatusTransition';
import { execSyncProposalPermissions } from './proposalStatusPagePermissions';

export async function updateProposalStatus ({
  proposalId,
  newStatus
}: {
  proposalId: string,
  newStatus: ProposalStatus
}): Promise<Proposal> {

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      status: true
    }
  });

  if (!proposal) {
    throw new MissingDataError(`Proposal with id ${proposalId} not found`);
  }

  if (!proposalStatusTransitionRecord[proposal.status].includes(newStatus)) {
    throw new InvalidStateError();
  }

  return prisma.$transaction(async () => {
    const updatedProposal = await prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        status: newStatus
      }
    });

    await execSyncProposalPermissions({
      proposalId: updatedProposal.id
    });

    return updatedProposal;
  });
}
