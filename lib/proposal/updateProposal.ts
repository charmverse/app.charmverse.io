import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import type { ProposalReviewerInput, ProposalWithUsers } from './interface';
import { generateSyncProposalPermissions } from './syncProposalPermissions';

export interface UpdateProposalRequest {
  proposalId: string;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  categoryId?: string | null;
}

export async function updateProposal ({
  proposalId,
  authors,
  reviewers,
  categoryId
}: UpdateProposalRequest): Promise<ProposalWithUsers> {
  if (authors.length === 0) {
    throw new InvalidStateError('Proposal must have at least 1 author');
  }

  await prisma.$transaction(async () => {
    // Update category only when it is present in request payload
    if (categoryId !== undefined) {
      await prisma.proposal.update({
        where: {
          id: proposalId
        },
        data: {
          categoryId
        }
      });
    }

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
      reviewers: true,
      category: true
    }
  }) as Promise<ProposalWithUsers>;
}
