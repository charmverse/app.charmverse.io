import { Vote } from '@prisma/client';
import { prisma } from 'db';

export async function getVotesBySpace (spaceId: string): Promise<Vote[]> {
  const pageVotes = await prisma.vote.findMany({
    where: {
      spaceId
    }
  });

  return pageVotes;
}
