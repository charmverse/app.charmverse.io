import { prisma } from 'db';
import { ExtendedVote } from './interfaces';

export async function getVotesByPage (pageId: string): Promise<ExtendedVote[]> {
  return prisma.vote.findMany({
    where: {
      pageId
    },
    include: {
      userVotes: {
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          user: {
            select: {
              avatar: true,
              username: true
            }
          }
        }
      },
      voteOptions: true
    }
  });
}
