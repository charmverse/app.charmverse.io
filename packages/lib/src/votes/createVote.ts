import { Prisma, VoteType, prisma } from '@charmverse/core/prisma-client';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishVoteEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { PageNotFoundError } from '@packages/pages/errors';
import { DuplicateDataError } from '@packages/utils/errors';

import { aggregateVoteResult } from './aggregateVoteResult';
import { getVotingPowerForVotes } from './getVotingPowerForVotes';
import type { ExtendedVote, VoteDTO } from './interfaces';
import { DEFAULT_THRESHOLD, VOTE_STATUS } from './interfaces';

export async function createVote(vote: VoteDTO & { spaceId: string }): Promise<ExtendedVote> {
  const {
    spaceId,
    createdBy,
    evaluationId,
    pageId,
    postId,
    title,
    content,
    contentText,
    deadline,
    type,
    voteOptions,
    context,
    strategy,
    blockNumber,
    chainId,
    tokenAddress
  } = vote;

  if (pageId && evaluationId) {
    const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluationId
      }
    });

    if (evaluation.voteId) {
      throw new DuplicateDataError('A vote already exists for this evaluation');
    }
  } else if (postId) {
    const post = await prisma.post.count({ where: { id: postId } });
    if (post === 0) {
      throw new PageNotFoundError(postId);
    }
  }
  //  else {
  //   throw new Error('Either pageId or postId must be provided to create a vote');
  // }

  const maxChoices = type !== VoteType.Approval && vote.maxChoices ? vote.maxChoices : 1;
  const voteType = maxChoices > 1 ? VoteType.MultiChoice : type;
  const threshold = voteType === VoteType.MultiChoice ? 0 : +vote.threshold;

  const dbVote = await prisma.vote.create({
    data: {
      content: content ?? Prisma.DbNull,
      contentText,
      title,
      threshold,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
      type: voteType,
      maxChoices,
      context,
      evaluation: evaluationId ? { connect: { id: evaluationId } } : undefined,
      strategy,
      blockNumber,
      chainId,
      tokenAddress,
      page: pageId
        ? {
            connect: {
              id: pageId
            }
          }
        : undefined,
      post: postId
        ? {
            connect: {
              id: postId
            }
          }
        : undefined,
      space: {
        connect: {
          id: spaceId
        }
      },
      author: {
        connect: {
          id: createdBy
        }
      },
      voteOptions: {
        create: voteOptions.map((option) => ({
          name: option
        }))
      }
    },
    include: {
      voteOptions: true
    }
  });

  if (vote.context === 'inline' && pageId) {
    await publishVoteEvent({
      scope: WebhookEventNames.VoteCreated,
      spaceId,
      voteId: dbVote.id
    });
  }

  const { aggregatedResult, userChoice } = aggregateVoteResult({
    userId: vote.createdBy,
    userVotes: [],
    voteOptions: dbVote.voteOptions
  });

  return {
    ...dbVote,
    votingPower: (
      await getVotingPowerForVotes({
        userId: vote.createdBy,
        votes: [dbVote]
      })
    )[0],
    aggregatedResult,
    userChoice,
    totalVotes: 0
  };
}
