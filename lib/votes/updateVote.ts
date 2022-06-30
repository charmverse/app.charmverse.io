import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError, UndesirableOperationError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { VoteStatusType, VOTE_STATUS } from './interfaces';

export async function updateVote (id: string, userId: string, status: VoteStatusType): Promise<Vote> {

  const existingVote = await prisma.vote.findUnique({
    where: {
      id
    }
  });

  if (!existingVote) {
    throw new DataNotFoundError(`Incorrect vote id: ${id}.`);
  }

  // If vote has a Cancelled status, it can't be updated.
  if (existingVote.status === VOTE_STATUS[3]) {
    throw new UndesirableOperationError(`Vote with id: ${id} has been cancelled and cannot be updated.`);
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
      userVotes: {
        include: {
          user: true
        }
      }
    }
  });

  return updatedVote;
}
