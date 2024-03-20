import { prisma } from '@charmverse/core/prisma-client';
import type { ProjectMember, Project } from '@charmverse/core/prisma-client';

export type ProjectWithMembers = Project & {
  members: ProjectMember[];
};

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
      members: project.projectMembers
    };
  });
}
