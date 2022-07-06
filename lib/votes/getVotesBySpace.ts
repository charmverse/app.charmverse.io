import { Vote } from '@prisma/client';
import { prisma } from 'db';

export async function getVotesBySpace (spaceId: string): Promise<Vote[]> {
  const pageVotes = await prisma.vote.findMany({
    where: {
      spaceId,
      page: {
        deletedAt: null
      }
    },
    include: {
      userVotes: {
        select: {
          userId: true
        }
      },
      page: {
        select: {
          path: true
        }
      }
    }
  });

  return pageVotes;
}
