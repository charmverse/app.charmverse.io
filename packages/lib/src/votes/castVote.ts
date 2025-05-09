import type { UserVote, Vote, VoteOptions } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishUserProposalEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { BigNumber } from 'ethers';

import { getVotingPowerForVotes } from './getVotingPowerForVotes';
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

  const votingPowers = await getVotingPowerForVotes({
    userId,
    votes: [vote]
  });

  if (vote.strategy === 'token' && votingPowers[0] === 0) {
    throw new InvalidInputError('User has no voting power.');
  }

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
      choices,
      tokenAmount: votingPowers[0].toString()
    },
    update: {
      choices,
      updatedAt: new Date(),
      tokenAmount: votingPowers[0].toString()
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
