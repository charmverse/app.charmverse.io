import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectUpdatePayload, ProjectWithMembers } from './interfaces';

export async function updateProject({
  userId,
  payload
}: {
  userId: string;
  payload: ProjectUpdatePayload;
}): Promise<ProjectWithMembers> {
  const [projects, ...projectMembers] = await prisma.$transaction([
    prisma.project.update({
      where: {
        id: payload.id
      },
      data: {
        description: payload.description,
        excerpt: payload.excerpt,
        name: payload.name,
        walletAddress: payload.walletAddress,
        blog: payload.blog,
        communityUrl: payload.communityUrl,
        github: payload.github,
        otherUrl: payload.otherUrl,
        productUrl: payload.productUrl,
        twitter: payload.twitter,
        website: payload.website
      }
    }),
    ...payload.projectMembers.map((member) =>
      prisma.projectMember.update({
        where: {
          id: member.id
        },
        data: {
          name: member.name,
          email: member.email,
          walletAddress: member.walletAddress,
          twitter: member.twitter,
          warpcast: member.warpcast,
          github: member.github,
          linkedin: member.linkedin,
          telegram: member.telegram,
          otherUrl: member.otherUrl,
          previousProjects: member.previousProjects,
          updatedBy: userId
        }
      })
    )
  ]);

  return {
    ...projects,
    projectMembers
  };
}
