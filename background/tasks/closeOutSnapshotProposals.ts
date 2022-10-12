import { prisma } from 'db';

/**
 * Find any snapshot-published proposals and close them out
 */
export async function closeOutSnapshotProposalsTask () {
  const proposalsToUpdate = await prisma.proposal.findMany({
    where: {
      status: 'vote_active',
      snapshotProposalExpiry: {
        not: null,
        lte: new Date()
      }
    }
  });

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: proposalsToUpdate.map(proposal => proposal.id)
      }
    },
    data: {
      status: 'vote_closed'
    }
  });
}
