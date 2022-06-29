import { Vote } from '@prisma/client';
import { prisma } from 'db';

export async function getPageVotes (pageId: string): Promise<Vote[]> {
  return prisma.vote.findMany({
    where: {
      pageId
    },
    include: {
      userVotes: true,
      voteOptions: true
    }
  });
}
