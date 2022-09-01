import { prisma } from 'db';
import { InvalidStateError, NotFoundError } from 'lib/middleware';

export async function openDiscussion (proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    }
  });

  if (!proposal) {
    throw new NotFoundError();
  }

  if (proposal.status !== 'private_draft' && proposal.status !== 'draft') {
    throw new InvalidStateError();
  }

  return prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: 'discussion'
    }
  });
}
