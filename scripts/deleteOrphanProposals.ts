import { prisma } from 'db';

async function deleteOrphanProposals () {
  await prisma.proposal.deleteMany({
    where: {
      page: null,
    },
  });
}

deleteOrphanProposals()
