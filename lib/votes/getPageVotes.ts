import { prisma } from 'db';
import { ExtendedVote } from './interfaces';

export async function getPageVotes (pageId: string): Promise<ExtendedVote[]> {
  return prisma.vote.findMany({
    where: {
      pageId
    },
    include: {
      userVotes: {
        orderBy: {
          updatedAt: 'desc'
        }
      },
      voteOptions: true
    }
  });
}
