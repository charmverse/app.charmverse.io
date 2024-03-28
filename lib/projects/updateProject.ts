import type { Prisma, ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getProjectMemberCreateTransaction } from './getProjectMemberCreateTransaction';
import type { ProjectValues, ProjectWithMembers } from './interfaces';

export async function updateProject({
  userId,
  payload,
  projectId
}: {
  projectId: string;
  userId: string;
  payload: ProjectValues;
}): Promise<ProjectWithMembers> {
  const existingProject = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      projectMembers: {
        select: {
          walletAddress: true,
          email: true,
          id: true
        }
      }
    }
  });

  const existingProjectMembersRecord = existingProject.projectMembers.reduce<
    Record<string, Pick<ProjectMember, 'walletAddress' | 'email' | 'id'>>
  >(
    (acc, projectMember) => ({
      ...acc,
      [projectMember.id]: projectMember
    }),
    {}
  );

  const payloadProjectMemberIds = payload.projectMembers.map((projectMember) => projectMember.id);
  const deletedProjectMembersIds = Object.keys(existingProjectMembersRecord).filter(
    (memberId) => !payloadProjectMemberIds.includes(memberId)
  );

  const projectMemberTransactions: Prisma.Prisma__ProjectMemberClient<ProjectMember, never>[] = [];

  for (const projectMember of payload.projectMembers) {
    if (projectMember.id && existingProjectMembersRecord[projectMember.id]) {
      projectMemberTransactions.push(
        prisma.projectMember.update({
          where: {
            id: projectMember.id
          },
          data: {
            name: projectMember.name,
            email: projectMember.email,
            walletAddress: projectMember.walletAddress,
            twitter: projectMember.twitter,
            warpcast: projectMember.warpcast,
            github: projectMember.github,
            linkedin: projectMember.linkedin,
            telegram: projectMember.telegram,
            otherUrl: projectMember.otherUrl,
            previousProjects: projectMember.previousProjects,
            updatedBy: userId
          }
        })
      );
    } else {
      projectMemberTransactions.push(
        (
          await getProjectMemberCreateTransaction({
            projectId,
            userId,
            projectMember
          })
        )()
      );
    }
  }

  const [projects, , ...projectMembers] = await prisma.$transaction([
    prisma.project.update({
      where: {
        id: projectId
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
        demoUrl: payload.demoUrl,
        twitter: payload.twitter,
        website: payload.website
      }
    }),
    prisma.projectMember.deleteMany({
      where: {
        id: {
          in: deletedProjectMembersIds
        }
      }
    }),
    ...projectMemberTransactions
  ]);

  return {
    ...projects,
    projectMembers
  };
}
