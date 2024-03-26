import type { ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { projectMemberDefaultValues } from './constants';

export async function addProjectMember({
  projectId,
  userId
}: {
  projectId: string;
  userId: string;
}): Promise<ProjectMember> {
  const createdProjectMember = await prisma.projectMember.create({
    data: {
      projectId,
      updatedBy: userId,
      ...projectMemberDefaultValues
    }
  });

  return createdProjectMember;
}
