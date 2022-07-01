import { prisma } from 'db';
import { ExtendedVote } from './interfaces';
import { updateVotesStatus } from './updateVotesStatus';

export async function getPageVotes (pageId: string): Promise<ExtendedVote[]> {
  const pageVotes = await prisma.vote.findMany({
    where: {
      pageId
    },
    include: {
      userVotes: {
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          user: true
        }
      },
      voteOptions: true
    }
  });

  return updateVotesStatus(pageVotes);
}
