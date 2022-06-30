import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { VoteStatusType } from './interfaces';

export async function updateVote (id: string, userId: string, status: VoteStatusType): Promise<Vote> {

  const existingVote = await prisma.vote.findUnique({
    where: {
      id
    }
  });

  if (!existingVote) {
    throw new DataNotFoundError(`Incorrect vote id: ${id}.`);
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: existingVote.spaceId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const updatedVote = await prisma.vote.update({
    where: {
      id
    },
    data: {
      status
    },
    include: {
      voteOptions: true,
      userVotes: true
    }
  });

  return updatedVote;
}
