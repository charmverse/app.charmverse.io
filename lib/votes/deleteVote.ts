import { Vote } from '@prisma/client';
import log from 'lib/log';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { prisma } from 'db';
import { getVote } from './getVote';

export async function deleteVote (id: string, userId: string): Promise<Vote | null> {
  const vote: Vote | null = await getVote(id);

  if (!vote) {
    log.warn(`Attempt to delete a non-existing vote with id: ${id}`);
    return null;
  }

  const userPermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: vote.spaceId,
    userId
  });
  if (!userPermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permissions to delete the vote.');
  }

  return prisma.vote.delete({
    where: {
      id
    }
  });
}
