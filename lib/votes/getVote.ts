import { prisma } from 'db';
import { ExtendedVote } from './interfaces';

export async function getVote (id: string): Promise<ExtendedVote | null> {
  return prisma.vote.findUnique({
    where: {
      id
    },
    include: {
      userVotes: {
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
