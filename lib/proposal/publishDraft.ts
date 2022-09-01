import { Proposal } from '@prisma/client';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';

export async function publishDraft (proposal: Proposal) {
  if (proposal.status !== 'private_draft') {
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
