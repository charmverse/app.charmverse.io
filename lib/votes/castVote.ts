
import { UserVote, VoteOptions } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/middleware';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';
import { VOTE_STATUS } from './interfaces';

export async function castVote (choice: string, voteId: string, userId: string): Promise<UserVote> {

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    include: {
      voteOptions: true
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`A vote with id ${voteId} was not found.`);
  }

  // If vote doesn't have an InProgress status, it can't take on new votes.
  if (vote.status !== VOTE_STATUS[0]) {
    throw new UndesirableOperationError(`Vote with id: ${voteId} is not in progress.`);
  }

  if (new Date(vote.deadline) < new Date()) {
    throw new UndesirableOperationError(`Vote with id: ${voteId} is past deadline.`);
  }

  if (!vote.voteOptions.find((option: VoteOptions) => option.name === choice)) {
    throw new InvalidInputError('Voting choice is not a valid option.');
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: vote.spaceId
  });

  if (error) {
    throw error;
  }

  const userVote = await prisma.userVote.upsert({
    where: {
      voteId_userId: {
        voteId,
        userId
      }
    },
    create: {
      userId,
      voteId,
      choice
    },
    update: {
      choice,
      updatedAt: new Date()
    }
  });

  return userVote;
}
