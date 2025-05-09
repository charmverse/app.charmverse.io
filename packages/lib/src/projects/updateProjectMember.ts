import { prisma } from '@charmverse/core/prisma-client';

import { findCharmVerseUserIdWithProjectMember } from './getProjectMemberCreateTransaction';
import type { ProjectMemberPayload } from './interfaces';

export type UpdateProjectMemberPayload = Partial<ProjectMemberPayload> & {
  id: string;
};

export async function updateProjectMember({
  projectMemberValues
}: {
  projectMemberValues: UpdateProjectMemberPayload;
}) {
  const projectMember = await prisma.projectMember.findUniqueOrThrow({
    where: {
      id: projectMemberValues.id
    },
    select: {
      userId: true
    }
  });

  const connectedUserId = projectMember.userId ?? (await findCharmVerseUserIdWithProjectMember(projectMemberValues));

  return prisma.projectMember.update({
    where: {
      id: projectMemberValues.id
    },
    data: {
      email: projectMemberValues.email,
      name: projectMemberValues.name,
      socialUrls: projectMemberValues.socialUrls?.map((url) => url?.trim()).filter(Boolean),
      walletAddress: projectMemberValues.walletAddress?.toLowerCase()?.trim(),
      userId: connectedUserId
    }
  });
}
