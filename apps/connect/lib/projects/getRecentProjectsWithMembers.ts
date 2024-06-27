import type { FarcasterUser, Project, ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ProjectWithMembers = Project & {
  projectMembers: (ProjectMember & {
    user: {
      farcasterUser: FarcasterUser | null;
    };
  })[];
};

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
  const projectWithMembers = (await prisma.project.findMany({
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
              farcasterUser: true
            }
          }
        }
      }
    }
  })) as ProjectWithMembers[];

  return projectWithMembers;
}
