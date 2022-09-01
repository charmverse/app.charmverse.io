import { prisma } from 'db';

async function migrateProposal () {
  const proposalPages = await prisma.page.findMany({
    where: {
      type: 'proposal'
    },
    select: {
      id: true,
      author: {
        select: {
          id: true
        }
      },
      spaceId: true
    }
  });

  await prisma.$transaction([
    prisma.proposal.createMany({
      data: proposalPages.map(proposalPage => ({
        createdBy: proposalPage.author.id,
        spaceId: proposalPage.spaceId,
        status: 'private_draft'
      }))
    }),
    prisma.proposalAuthor.createMany({
      data: proposalPages.map(proposalPage => ({
        proposalId: proposalPage.id,
        userId: proposalPage.author.id
      }))
    }),
    prisma.proposalReviewer.createMany({
      data: proposalPages.map(proposalPage => ({
        proposalId: proposalPage.id,
        userId: proposalPage.author.id
      }))
    })
  ]);
}

migrateProposal();
