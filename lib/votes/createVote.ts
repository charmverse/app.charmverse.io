
import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError } from 'lib/utilities/errors';
import { DEFAULT_THRESHOLD, VoteDTO, VOTE_STATUS } from './interfaces';

export async function createVote (vote: VoteDTO): Promise<Vote> {

  const { createdBy, pageId, spaceId, title, threshold, description, deadline, voteOptions } = vote;

  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true
    }
  });

  if (!existingPage) {
    throw new DataNotFoundError(`Cannot create poll as linked page with id ${pageId} was not found.`);
  }

  const dbVote = await prisma.vote.create({
    data: {
      description,
      title,
      threshold: threshold ?? DEFAULT_THRESHOLD,
      deadline: new Date(deadline),
      status: VOTE_STATUS[0],
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
          name: option.name
        }))
      }
    },
    include: {
      voteOptions: true
    }
  });

  return dbVote;
}
