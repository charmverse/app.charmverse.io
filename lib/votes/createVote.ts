
import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DEFAULT_THRESHOLD, VoteDTO, VOTE_STATUS } from './interfaces';
import { getVote } from './getVote';

export async function createVote (vote: VoteDTO): Promise<Vote | null> {

  const { createdBy, pageId, title, description, deadline, options } = vote;

  if (!pageId) {
    throw new InvalidInputError('Please provide the id of the page where the vote is taking place.');
  }

  if (!options) {
    throw new InvalidInputError('Please provide voting options.');
  }

  if (!deadline) {
    throw new InvalidInputError('Please provide voting deadline.');
  }

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

  const { error } = await hasAccessToSpace({
    userId: createdBy,
    spaceId: existingPage.spaceId,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  const createdVote = await prisma.vote.create({
    data: {
      description,
      title,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
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
      }
    },
    include: {
      voteOptions: true
    }
  });

  await prisma.voteOptions.createMany({
    data: options.map(option => ({
      name: option.name,
      threshold: option.threshold || DEFAULT_THRESHOLD,
      voteId: createdVote.id
    }))
  });

  const dbVote = await getVote(createdVote.id);

  return dbVote;
}
