import type { Vote } from '@prisma/client';
import { prisma } from 'db';
import log from 'lib/log';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';
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

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: vote.spaceId,
    userId,
    adminOnly: false
  });

  if (error || (vote.createdBy !== userId && !isAdmin)) {
    throw new UnauthorisedActionError('You do not have permissions to update the vote.');
  }

  return prisma.vote.delete({
    where: {
      id
    }
  });
}
