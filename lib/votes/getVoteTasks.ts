import { prisma } from 'db';
import { VoteTask } from './interfaces';

export async function getVoteTasks (userId: string): Promise<VoteTask[]> {
  const votes = await prisma.vote.findMany({
    where: {
      space: {
        spaceRoles: {
          some: {
            userId
          }
        }
      },
      status: 'InProgress',
      // No need to fetch votes that have been casted by the user
      userVotes: {
        none: {
          userId
        }
      },
      // No need to fetch votes that are passed deadline, those can't be voted on
      deadline: {
        gte: new Date()
      }
    },
    orderBy: {
      deadline: 'asc'
    },
    include: {
      page: true,
      space: true
    }
  });

  return votes;
}
