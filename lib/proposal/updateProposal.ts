import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { ProposalReviewerInput, ProposalWithUsers } from './interface';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export interface UpdateProposalRequest {
  proposalId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
}

export async function updateProposal ({
  proposalId,
  authors,
  reviewers
}: UpdateProposalRequest): Promise<ProposalWithUsers> {
  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  await prisma.$transaction(async () => {
    await prisma.proposalAuthor.deleteMany({
      where: {
        proposalId
      }
    });
    await prisma.proposalAuthor.createMany({
      data: authors.map(author => ({ proposalId, userId: author }))
    });
    await prisma.proposalReviewer.deleteMany({
      where: {
        proposalId
      }
    });
    await prisma.proposalReviewer.createMany({
      data: reviewers.map(reviewer => ({
        proposalId,
        userId: reviewer.group === 'user' ? reviewer.id : null,
        roleId: reviewer.group === 'role' ? reviewer.id : null
      }))
    });

    const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId });

    await prisma.pagePermission.deleteMany(deleteArgs);

    // Replicate serial execution of a normal transaction as we must ensure the order of page permission creations for child inheritance
    for (const arg of createArgs) {
      await prisma.pagePermission.create(arg);
    }

  });

  return prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    include: {
      authors: true,
      reviewers: true
    }
  }) as Promise<ProposalWithUsers>;
}
