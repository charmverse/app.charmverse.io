
import { prisma } from 'db';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { DEFAULT_THRESHOLD, ExtendedVote, VoteDTO, VOTE_STATUS } from './interfaces';
import { aggregateVoteResult } from './aggregateVoteResult';

export async function createVote (vote: VoteDTO): Promise<ExtendedVote> {

  const { createdBy, pageId, title, threshold, description, deadline, type, voteOptions } = vote;

  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (!existingPage) {
    throw new DataNotFoundError(`Cannot create poll as linked page with id ${pageId} was not found.`);
  }

  const userPermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: existingPage.spaceId,
    userId: createdBy
  });
  if (!userPermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permissions to create a vote.');
  }

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
          id: existingPage.spaceId
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
