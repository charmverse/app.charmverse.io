import { prisma } from '@charmverse/core/prisma-client';

import { projectInclude } from './constants';

export async function getProjectById(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: projectInclude
  });
}
