import type { Prisma, ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

import {
  findCharmVerseUserIdWithProjectMember,
  getProjectMemberCreateTransaction
} from './getProjectMemberCreateTransaction';
import type { ProjectAndMembersPayload, ProjectWithMembers } from './interfaces';

export async function updateProject({
  userId,
  payload,
  projectId
}: {
  projectId: string;
  userId: string;
  payload: ProjectAndMembersPayload;
}): Promise<ProjectWithMembers> {
  const existingProjectWithMembers = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      projectMembers: {
        select: {
          id: true
        }
      }
    }
  });

  const existingProjectMembersRecord = existingProjectWithMembers.projectMembers.reduce<
    Record<string, Pick<ProjectMember, 'id'>>
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

  for (const projectMemberId of deletedProjectMembersIds) {
    trackUserAction('remove_project_member', { userId, projectId, projectMemberId });
  }

  const projectMemberUpdateTransactions: Prisma.Prisma__ProjectMemberClient<ProjectMember, never>[] = [];

  const newlyCreatedProjectMembersPayload: ProjectAndMembersPayload['projectMembers'] = [];

  for (const projectMember of payload.projectMembers) {
    if (projectMember.id && existingProjectMembersRecord[projectMember.id]) {
      const connectedUserId = projectMember.userId ?? (await findCharmVerseUserIdWithProjectMember(projectMember));
      projectMemberUpdateTransactions.push(
        prisma.projectMember.update({
          where: {
            id: projectMember.id
          },
          data: {
            name: projectMember.name,
            email: projectMember.email,
            walletAddress: projectMember.walletAddress?.toLowerCase(),
            twitter: projectMember.twitter,
            warpcast: projectMember.warpcast,
            github: projectMember.github,
            linkedin: projectMember.linkedin,
            telegram: projectMember.telegram,
            otherUrl: projectMember.otherUrl,
            previousProjects: projectMember.previousProjects,
            updatedBy: userId,
            userId: connectedUserId
          }
        })
      );
    } else {
      newlyCreatedProjectMembersPayload.push(projectMember);
    }
  }

  const projectMembersCreatePayload = await Promise.all(
    newlyCreatedProjectMembersPayload.map(async (projectMemberPayload) => {
      const charmVerseUserIdWithProjectMember = await findCharmVerseUserIdWithProjectMember(projectMemberPayload);
      trackUserAction('add_project_member', {
        userId,
        projectId,
        connectedUserId: charmVerseUserIdWithProjectMember,
        email: projectMemberPayload.email,
        walletAddress: projectMemberPayload.walletAddress
      });

      return {
        connectedUserId: charmVerseUserIdWithProjectMember,
        projectMember: projectMemberPayload
      };
    })
  );

  await prisma.$transaction([
    prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        description: payload.description,
        excerpt: payload.excerpt,
        name: payload.name,
        walletAddress: payload.walletAddress?.toLowerCase(),
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
    ...projectMemberUpdateTransactions,
    ...projectMembersCreatePayload.map((projectMemberCreatePayload) =>
      getProjectMemberCreateTransaction({
        projectId,
        projectMember: projectMemberCreatePayload.projectMember,
        userId,
        connectedUserId: projectMemberCreatePayload.connectedUserId
      })
    )
  ]);

  const projectWithMembers = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      projectMembers: true
    }
  });

  return projectWithMembers;
}
