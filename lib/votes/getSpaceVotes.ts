import { prisma } from 'db';
import { ExtendedVote } from './interfaces';

export async function getSpaceVotes (spaceId: string): Promise<ExtendedVote[]> {
  return prisma.vote.findMany({
    where: {
      spaceId
    },
    include: {
      userVotes: true,
      voteOptions: true
    }
  });
}
