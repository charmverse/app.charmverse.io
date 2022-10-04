import type { Vote } from '@prisma/client';

import { prisma } from 'db';
import log from 'lib/log';
import { UndesirableOperationError } from 'lib/utilities/errors';

import { getVote } from './getVote';

export async function deleteVote (id: string, userId: string): Promise<Vote | null> {
  const vote: Vote | null = await getVote(id, userId);

  if (!vote) {
    log.warn(`Attempt to delete a non-existing vote with id: ${id}`);
    return null;
  }

  if (vote.context === 'proposal') {
    throw new UndesirableOperationError("Proposal votes can't be deleted");
  }

  return prisma.vote.delete({
    where: {
      id
    }
  });
}
