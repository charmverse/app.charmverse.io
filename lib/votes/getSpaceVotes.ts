import { prisma } from 'db';
import { ExtendedVote } from './interfaces';
import { updateVotesStatus } from './updateVotesStatus';

export async function getSpaceVotes (spaceId: string): Promise<ExtendedVote[]> {
  const pageVotes = await prisma.vote.findMany({
    where: {
      spaceId
    },
    include: {
      userVotes: {
        include: {
          user: true
        }
      },
      voteOptions: true
    }
  });

  return updateVotesStatus(pageVotes);
}
