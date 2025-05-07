import type { Vote } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, UndesirableOperationError } from '@packages/utils/errors';

import type { UpdateVoteDTO } from './interfaces';
import { VOTE_STATUS } from './interfaces';

export async function updateVote(id: string, userId: string, update: Partial<UpdateVoteDTO>): Promise<Vote> {
  const { status, deadline } = update;
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
  if (status && status !== VOTE_STATUS[3]) {
    throw new UndesirableOperationError('Votes can only be cancelled.');
  }

  if (existingVote.context === 'proposal' && status === 'Cancelled') {
    throw new UndesirableOperationError("Proposal votes can't be cancelled");
  }

  if (deadline && new Date(existingVote.createdAt) > new Date(deadline)) {
    throw new UndesirableOperationError('The deadline needs to be in the future');
  }

  const updatedVote = await prisma.vote.update({
    where: {
      id
    },
    data: {
      status,
      deadline
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
