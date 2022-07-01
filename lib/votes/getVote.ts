import { prisma } from 'db';
import { ExtendedVote } from './interfaces';
import { updateVotesStatus } from './updateVotesStatus';

export async function getVote (id: string): Promise<ExtendedVote | null> {
  const pageVote = await prisma.vote.findUnique({
    where: {
      id
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

  return pageVote ? (await updateVotesStatus([pageVote]))[0] : null;
}
