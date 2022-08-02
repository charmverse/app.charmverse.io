
import { prisma } from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { aggregateVoteResult } from './aggregateVoteResult';
import { DEFAULT_THRESHOLD, ExtendedVote, VoteCreationData, VoteDTO, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteCreationData): Promise<ExtendedVote> {
  const { spaceId, createdBy, pageId, proposalId, title, threshold, description, deadline, type, voteOptions } = vote;

  if (!pageId && !proposalId) {
    throw new InvalidInputError('Please provide a pageId or proposalId to to create a vote');
  }

  const voteType = vote.pageId ? 'page' : 'proposal';

  const pageOrProposal = await (voteType === 'page' ? prisma.page.findUnique({
    where: {
      id: pageId
    }
  }) : prisma.proposal.findUnique({
    where: {
      id: proposalId
    }
  }));

  if (!pageOrProposal) {
    throw new DataNotFoundError(`Cannot create vote as linked ${voteType} with id ${pageId ?? proposalId} was not found.`);
  }

  const dbVote = await prisma.vote.create({
    data: {
      description,
      title,
      threshold: +threshold ?? DEFAULT_THRESHOLD,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
      type,
      page: voteType === 'page' ? {
        connect: {
          id: pageId
        }
      } : undefined,
      proposal: voteType === 'proposal' ? {
        connect: {
          id: proposalId
        }
      } : undefined,
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
