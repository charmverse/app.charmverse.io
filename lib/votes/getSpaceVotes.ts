import { Vote } from '@prisma/client';
import { prisma } from 'db';

export async function getSpaceVotes (spaceId: string): Promise<Vote[]> {
  return prisma.vote.findMany({
    where: {
      spaceId
    },
    include: {
      userVotes: true
    }
  });
}
