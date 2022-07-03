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
      status: 'InProgress'
    },
    orderBy: {
      deadline: 'desc'
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
