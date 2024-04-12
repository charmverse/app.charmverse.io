import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectWithMembers } from './interfaces';

export async function getProjectsByUserId({ userId }: { userId: string }): Promise<ProjectWithMembers[]> {
  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          userId
        }
      }
    },
    include: {
      projectMembers: {
        orderBy: [
          {
            teamLead: 'desc'
          },
          {
            createdAt: 'asc'
          }
        ]
      }
    }
  });

  return projects.map((project) => {
    return {
      ...project,
      projectMembers: project.projectMembers
    };
  });
}
