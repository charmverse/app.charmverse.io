import { prisma } from '@charmverse/core/prisma-client';

import { projectInclude } from './constants';
import type { ProjectWithMembers } from './interfaces';

export async function getProjectById(projectId: string): Promise<ProjectWithMembers> {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: projectInclude
  });
}
