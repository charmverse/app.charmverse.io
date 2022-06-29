
import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { VoteModel, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteModel): Promise<Vote> {

  const { initiatorId, pageId, title, description, deadline, options } = vote;

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
      description: description as string,
      title,
      deadline,
      options: options as string,
      status: VOTE_STATUS[0],
      page: {
        connect: {
          id: pageId
        }
      },
      initiator: {
        connect: {
          id: initiatorId
        }
      }
    }
  });

  return createdVote;
}
