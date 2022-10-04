
import type { UserVote, Vote, VoteOptions } from '@prisma/client';

import { prisma } from 'db';
import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';

import { isVotingClosed } from './utils';

export async function castVote (choice: string, vote: Vote & { voteOptions: VoteOptions[] }, userId: string): Promise<UserVote> {
  const voteId = vote.id;
  if (isVotingClosed(vote)) {
    throw new UndesirableOperationError(`Vote with id: ${voteId} is past deadline.`);
  }

  if (!vote.voteOptions.find((option: VoteOptions) => option.name === choice)) {
    throw new InvalidInputError('Voting choice is not a valid option.');
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
