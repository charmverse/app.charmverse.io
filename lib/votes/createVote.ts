import { prisma } from '@charmverse/core';

import { PageNotFoundError } from 'lib/pages/server';
import { DuplicateDataError } from 'lib/utilities/errors';

import { aggregateVoteResult } from './aggregateVoteResult';
import type { ExtendedVote, VoteDTO } from './interfaces';
import { DEFAULT_THRESHOLD, VOTE_STATUS } from './interfaces';

export async function createVote(vote: VoteDTO & { spaceId: string }): Promise<ExtendedVote> {
  const { spaceId, createdBy, pageId, postId, title, threshold, description, deadline, type, voteOptions, context } =
    vote;

  if (pageId) {
    const page = await prisma.page.findUnique({
      where: {
        id: pageId
      },
      select: {
        votes: true
      }
    });

    if (!page) {
      throw new PageNotFoundError(pageId);
    }

    if (context === 'proposal' && page.votes.some((v) => v.context === 'proposal')) {
      throw new DuplicateDataError('A proposal vote has already been created for this page.');
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

  const dbVote = await prisma.vote.create({
    data: {
      description,
      title,
      threshold: +threshold ?? DEFAULT_THRESHOLD,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
      type,
      context,
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
