import { Prisma, VoteType, prisma } from '@charmverse/core/prisma-client';

import { PageNotFoundError } from 'lib/pages/server';
import { DuplicateDataError } from 'lib/utils/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishVoteEvent } from 'lib/webhookPublisher/publishEvent';

import { aggregateVoteResult } from './aggregateVoteResult';
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
    context
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
  const threshold = voteType === VoteType.MultiChoice ? 0 : +vote.threshold ?? DEFAULT_THRESHOLD;

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
    aggregatedResult,
    userChoice,
    totalVotes: 0
  };
}
