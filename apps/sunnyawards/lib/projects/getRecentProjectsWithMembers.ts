import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@packages/utils/url';

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
          source: 'sunny_awards',
          projectMembers: {
            some: {
              userId
            }
          }
        }
      : {
          deletedAt: null,
          source: 'sunny_awards',
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

  return projectWithMembers.map((project) => ({
    ...project,
    avatar: replaceS3Domain(project.avatar),
    coverImage: replaceS3Domain(project.coverImage)
  }));
}

export type ProjectsWithMembers = Prisma.PromiseReturnType<typeof getRecentProjectsWithMembers>;
