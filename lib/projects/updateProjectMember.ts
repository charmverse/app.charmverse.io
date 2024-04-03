import { prisma } from '@charmverse/core/prisma-client';

import { findCharmVerseUserIdWithProjectMember } from './getProjectMemberCreateTransaction';
import type { ProjectAndMembersPayload } from './interfaces';

export async function updateProjectMember({
  projectMemberValues
}: {
  projectMemberValues: ProjectAndMembersPayload['projectMembers'][0];
}) {
  const connectedUserId =
    projectMemberValues.userId ?? (await findCharmVerseUserIdWithProjectMember(projectMemberValues));

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
      walletAddress: projectMemberValues.walletAddress,
      warpcast: projectMemberValues.warpcast,
      userId: connectedUserId
    }
  });
}
