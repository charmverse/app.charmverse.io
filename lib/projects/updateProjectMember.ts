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
      github: projectMemberValues.github,
      linkedin: projectMemberValues.linkedin,
      name: projectMemberValues.name,
      otherUrl: projectMemberValues.otherUrl,
      previousProjects: projectMemberValues.previousProjects,
      telegram: projectMemberValues.telegram,
      twitter: projectMemberValues.twitter,
      walletAddress: projectMemberValues.walletAddress?.toLowerCase()?.trim(),
      warpcast: projectMemberValues.warpcast,
      userId: connectedUserId
    }
  });
}
