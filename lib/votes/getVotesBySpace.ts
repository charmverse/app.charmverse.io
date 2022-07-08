import { Vote } from '@prisma/client';
import { prisma } from 'db';
import { calculateVoteStatus } from './calculateVoteStatus';

export async function getVotesBySpace (spaceId: string): Promise<Vote[]> {
  const spaceVotes = await prisma.vote.findMany({
    where: {
      spaceId,
      page: {
        deletedAt: null
      }
    },
    include: {
      userVotes: true,
      voteOptions: true
    }
  });

  return spaceVotes.map(spaceVote => {
    const voteStatus = calculateVoteStatus(spaceVote);
    const userVotes = spaceVote.userVotes;

    delete (spaceVote as any).userVotes;

    return {
      ...spaceVote,
      status: voteStatus,
      totalVotes: userVotes.length
    };
  });
}
