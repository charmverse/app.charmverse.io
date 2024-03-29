import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectValues } from './interfaces';

export async function updateProjectMember({
  projectMemberValues
}: {
  projectMemberValues: ProjectValues['projectMembers'][0];
}) {
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
      warpcast: projectMemberValues.warpcast
    }
  });
}
