import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';

async function migrateProposal () {
  const proposalPages = await prisma.page.findMany({
    where: {
      type: 'proposal'
    },
    select: {
      id: true,
      createdBy: true,
      spaceId: true
    }
  });

  await prisma.$transaction([
    prisma.proposal.createMany({
      data: proposalPages.map(proposalPage => ({
        id: proposalPage.id,
        createdBy: proposalPage.createdBy,
        spaceId: proposalPage.spaceId,
        status: 'private_draft' as ProposalStatus
      }))
    }),
    prisma.proposalAuthor.createMany({
      data: proposalPages.map(proposalPage => ({
        proposalId: proposalPage.id,
        userId: proposalPage.createdBy
      }))
    }),
    prisma.proposalReviewer.createMany({
      data: proposalPages.map(proposalPage => ({
        proposalId: proposalPage.id,
        userId: proposalPage.createdBy
      }))
    }),
    ...proposalPages.map(proposalPage => prisma.page.update({
      where: {
        id: proposalPage.id
      },
      data: {
        proposal: {
          connect: {
            id: proposalPage.id
          }
        }
      }
    }))
  ]);
}

migrateProposal();
