import { prisma } from '@charmverse/core/prisma-client';

/**
 * Get recent projects with members
 * @param resultsNo How many results to be returned
 * @returns Project & Project Members for each project
 */
export async function getRecentProjectsWithMembers(resultsNo: number = 10) {
  return prisma.project.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: resultsNo,
    include: {
      projectMembers: {
        include: {
          user: {
            select: {
              avatar: true
            }
          }
        }
      }
    }
  });
}
