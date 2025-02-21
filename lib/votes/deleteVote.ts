import { log } from '@charmverse/core/log';
import type { Vote } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { UndesirableOperationError } from '@packages/utils/errors';

import { getVote } from './getVote';

export async function deleteVote(id: string, userId: string): Promise<Vote | null> {
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
