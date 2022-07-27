
import { prisma } from 'db';
import { aggregateVoteResult } from './aggregateVoteResult';
import { DEFAULT_THRESHOLD, ExtendedVote, VoteDTO, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteDTO & {spaceId: string}): Promise<ExtendedVote> {
  const { spaceId, createdBy, pageId, title, threshold, description, deadline, type, voteOptions } = vote;
  const dbVote = await prisma.vote.create({
    data: {
      description,
      title,
      threshold: +threshold ?? DEFAULT_THRESHOLD,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
      type,
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
