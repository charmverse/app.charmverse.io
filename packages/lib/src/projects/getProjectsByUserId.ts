import { prisma } from '@charmverse/core/prisma-client';

import { projectInclude } from './constants';
import type { ProjectWithMembers } from './interfaces';

export async function getProjectsByUserId({ userId }: { userId: string }): Promise<ProjectWithMembers[]> {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      projectMembers: {
        some: {
          userId
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: projectInclude
  });

  return projects.map((project) => {
    return {
      ...project,
      projectMembers: project.projectMembers
    };
  });
}
