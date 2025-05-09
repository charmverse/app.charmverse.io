import type { ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { findCharmVerseUserIdWithProjectMember } from './getProjectMemberCreateTransaction';
import type { ProjectMemberPayload } from './interfaces';

export type AddProjectMemberPayload = Partial<ProjectMemberPayload>;

export async function addProjectMember({
  payload,
  projectId,
  userId
}: {
  projectId: string;
  userId: string;
  // Allow partial values since we create project member as soon as "Add a new project member" option is selected
  payload: AddProjectMemberPayload;
}): Promise<ProjectMember> {
  const connectedUserId = await findCharmVerseUserIdWithProjectMember(payload);

  const projectMember = await prisma.projectMember.create({
    data: {
      projectId,
      name: payload.name || '',
      updatedBy: userId,
      email: payload.email,
      teamLead: false,
      socialUrls: payload.socialUrls?.filter(Boolean),
      walletAddress: payload.walletAddress?.toLowerCase()?.trim(),
      userId: connectedUserId
    }
  });

  return projectMember;
}
