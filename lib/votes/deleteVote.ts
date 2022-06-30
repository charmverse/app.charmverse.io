import { Vote } from '@prisma/client';
import log from 'lib/log';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { getVote } from './getVote';

export async function deleteVote (id: string, userId: string): Promise<Vote | null> {
  const vote: Vote | null = await getVote(id);

  if (!vote) {
    log.warn(`Attempt to delete a non-existing vote with id: ${id}`);
    return null;
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: vote.spaceId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  return prisma.vote.delete({
    where: {
      id
    }
  });
}
