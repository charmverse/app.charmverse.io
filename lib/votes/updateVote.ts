import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError, UndesirableOperationError, UnauthorisedActionError } from 'lib/utilities/errors';
import { computeSpacePermissions } from 'lib/permissions/spaces';
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
  if (existingVote.status !== VOTE_STATUS[0]) {
    throw new UndesirableOperationError('Only in progress votes can be updated.');
  }

  // If vote has a Cancelled status, it can't be updated.
  if (status !== VOTE_STATUS[3]) {
    throw new UndesirableOperationError('Votes can only be cancelled.');
  }

  const userPermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: existingVote.spaceId,
    userId
  });
  if (!userPermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permissions to update the vote.');
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
