import type { Vote } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, UndesirableOperationError } from 'lib/utilities/errors';

import type { VoteStatusType } from './interfaces';
import { VOTE_STATUS } from './interfaces';

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

  if (existingVote.context === 'proposal') {
    throw new UndesirableOperationError("Proposal votes can't be cancelled");
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
