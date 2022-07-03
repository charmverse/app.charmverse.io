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
    select: {
      id: true,
      title: true,
      pageId: true,
      spaceId: true,
      deadline: true,
      page: {
        select: {
          title: true,
          path: true
        }
      },
      space: {
        select: {
          name: true,
          domain: true
        }
      }
    }
  });

  return votes;
}
