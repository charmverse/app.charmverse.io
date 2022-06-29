import { prisma } from 'db';
import { Vote } from '@prisma/client';
import { DataNotFoundError } from 'lib/utilities/errors';
import { VoteStatusType } from './interfaces';

export async function updateVote (id: string, status: VoteStatusType): Promise<Vote> {

  const existingVote = await prisma.vote.findUnique({
    where: {
      id
    }
  });

  if (!existingVote) {
    throw new DataNotFoundError(`Incorrect vote id: ${id}.`);
  }

  const updatedVote = await prisma.vote.update({
    where: {
      id
    },
    data: {
      status
    },
    include: {
      voteOptions: true
    }
  });

  return updatedVote;
}
