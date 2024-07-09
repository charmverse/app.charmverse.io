import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Get recent projects with members
 * @param resultsNo How many results to be returned
 * @returns Project & Project Members for each project
 */
export async function getRecentProjectsWithMembers({
  resultsNo,
  userId
}: {
  userId?: string;
  resultsNo?: number;
} = {}) {
  const projectWithMembers = await prisma.project.findMany({
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
              farcasterUser: true
            }
          }
        }
      }
    }
  });

  return projectWithMembers;
}

export type ProjectsWithMembers = Prisma.PromiseReturnType<typeof getRecentProjectsWithMembers>;
