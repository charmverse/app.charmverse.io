
import { prisma } from 'db';
import { PageNotFoundError } from 'lib/pages/server';
import { DuplicateDataError } from 'lib/utilities/errors';

import { aggregateVoteResult } from './aggregateVoteResult';
import type { ExtendedVote, VoteDTO } from './interfaces';
import { DEFAULT_THRESHOLD, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteDTO & { spaceId: string }): Promise<ExtendedVote> {
  const { spaceId, createdBy, pageId, title, threshold, description, deadline, type, voteOptions, context } = vote;

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

  if (context === 'proposal' && page.votes.some(v => v.context === 'proposal')) {
    throw new DuplicateDataError('A proposal vote has already been created for this page.');
  }

  const dbVote = await prisma.vote.create({
    data: {
      description,
      title,
      threshold: +threshold ?? DEFAULT_THRESHOLD,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
      type,
      context,
      page: {
        connect: {
          id: pageId
        }
      },
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
        create: voteOptions.map(option => ({
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
