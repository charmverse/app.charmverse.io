import { Proposal } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';

export async function closeDiscussion (proposal: Proposal) {
  if (proposal.status !== 'discussion') {
    throw new InvalidStateError();
  }

  return prisma.proposal.update({
    where: {
      id: proposal.id
    },
    data: {
      status: 'draft'
    }
  });
}
