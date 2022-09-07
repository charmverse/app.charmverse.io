import type { UpdateProposalRequest } from 'charmClient/apis/proposalsApi';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';

export async function updateProposal ({
  proposalId,
  authors,
  reviewers
}: {
  proposalId: string,
} & UpdateProposalRequest) {
  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have atleast 1 author');
  }

  await prisma.$transaction([
    prisma.proposalAuthor.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.proposalAuthor.createMany({
      data: authors.map(author => ({ proposalId, userId: author }))
    })
  ]);

  await prisma.$transaction([
    prisma.proposalReviewer.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.proposalReviewer.createMany({
      data: reviewers.map(reviewer => ({
        proposalId,
        userId: reviewer.group === 'user' ? reviewer.id : null,
        roleId: reviewer.group === 'role' ? reviewer.id : null
      }))
    })
  ]);
}
