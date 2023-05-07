import { prisma } from '@charmverse/core';
import type { UserVote, Vote, VoteOptions } from '@charmverse/core/prisma';

import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishUserProposalEvent } from 'lib/webhookPublisher/publishEvent';

import { isVotingClosed } from './utils';

export async function castVote(
  choice: string,
  vote: Vote & { voteOptions: VoteOptions[] },
  userId: string
): Promise<UserVote> {
  const voteId = vote.id;
  if (isVotingClosed(vote)) {
    throw new UndesirableOperationError(`Vote with id: ${voteId} is past deadline.`);
  }

  if (!vote.voteOptions.find((option: VoteOptions) => option.name === choice)) {
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
