import { Proposal } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';

export async function unpublishDraft (proposal: Proposal) {
  if (proposal.status !== 'draft') {
    throw new InvalidStateError();
  }

  return prisma.proposal.update({
    where: {
      id: proposal.id
    },
    data: {
      status: 'private_draft'
    }
  });
}
