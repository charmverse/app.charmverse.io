import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectWithMembers } from 'components/projects/interfaces';

export async function getProjects({ userId }: { userId: string }): Promise<ProjectWithMembers[]> {
  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          userId
        }
      }
    },
    include: {
      projectMembers: true
    }
  });

  return projects.map((project) => {
    return {
      ...project,
      projectMembers: project.projectMembers
    };
  });
}
