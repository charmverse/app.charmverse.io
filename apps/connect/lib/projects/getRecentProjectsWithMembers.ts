import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Get recent projects with members
 * @param resultsNo How many results to be returned
 * @returns Project & Project Members for each project
 */
export async function getRecentProjectsWithMembers({
  resultsNo = 10,
  userId
}: {
  userId?: string;
  resultsNo?: number;
} = {}) {
  return prisma.project.findMany({
    where: userId
      ? {
          deletedAt: null,
          projectMembers: {
            some: {
              userId
            }
          }
        }
      : {
          deletedAt: null,
          projectMembers: {
            some: {}
          }
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

export type ProjectsWithMembers = Prisma.PromiseReturnType<typeof getRecentProjectsWithMembers>;
