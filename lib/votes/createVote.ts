
import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { DEFAULT_THRESHOLD, VoteDTO, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteDTO): Promise<Vote> {

  const { createdBy, pageId, title, description, deadline, options } = vote;

  if (!pageId) {
    throw new InvalidInputError('Please provide the id of the page where the vote is taking place.');
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

  const createdVote = await prisma.vote.create({
    data: {
      description,
      title,
      deadline,
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

  return createdVote;
}
