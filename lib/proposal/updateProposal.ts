import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { UpdateProposalRequest } from './interface';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export async function updateProposal ({
  proposalId,
  authors,
  reviewers
}: {
  proposalId: string,
} & UpdateProposalRequest) {
  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId });

  await prisma.$transaction([
    prisma.proposalAuthor.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.proposalAuthor.createMany({
      data: authors.map(author => ({ proposalId, userId: author }))
    }),
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
    }),
    prisma.pagePermission.deleteMany(deleteArgs),
    ...createArgs.map(arg => prisma.pagePermission.create(arg))
  ]);
}
