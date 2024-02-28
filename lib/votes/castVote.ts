import type { UserVote, Vote, VoteOptions } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError, UndesirableOperationError } from 'lib/utils/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishUserProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { isVotingClosed } from './utils';

export async function castVote(
  choices: string[],
  vote: Vote & { voteOptions: VoteOptions[] },
  userId: string
): Promise<UserVote> {
  const voteId = vote.id;

  if (isVotingClosed(vote)) {
    throw new UndesirableOperationError(`Vote with id: ${voteId} is past deadline.`);
  }

  if (vote.maxChoices && choices.length > vote.maxChoices) {
    if (vote.maxChoices === 1) {
      throw new InvalidInputError('Vote allows only one choice.');
    }

    throw new InvalidInputError(`Vote allows only ${vote.maxChoices} choices.`);
  }

  if (choices.some((choice) => !vote.voteOptions.find((option) => option.name === choice))) {
    throw new InvalidInputError('Voting choice is not a valid option.');
  }

  const isFirstVote = !(await prisma.userVote.findUnique({
    where: {
      voteId_userId: {
        voteId,
        userId
      }
    }
  }));

  // TODO - delete user vote when choices.length === 0

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
      choices
    },
    update: {
      choices,
      updatedAt: new Date()
    },
    include: {
      vote: true
    }
  });

  if (isFirstVote && userVote.vote.pageId && userVote.vote.context === 'proposal') {
    await publishUserProposalEvent({
      scope: WebhookEventNames.ProposalUserVoted,
      userId,
      proposalId: userVote.vote.pageId,
      spaceId: userVote.vote.spaceId
    });
  }

  return userVote;
}
