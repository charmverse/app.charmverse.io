import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';

import { getProjectById } from './getProjectById';
import {
  findCharmVerseUserIdWithProjectMember,
  getProjectMemberCreateTransaction
} from './getProjectMemberCreateTransaction';
import type { ProjectAndMembersPayload, ProjectWithMembers } from './interfaces';

export async function updateProjectAndMembers({
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

  const teamLeads = payload.projectMembers.filter((member) => member.teamLead);
  if (teamLeads.length !== 1) {
    throw new InvalidInputError('Exactly one team lead is required');
  }

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
            // our multitextinput form field sometimes sends [undefined] at first if no website is given
            socialUrls: projectMember.socialUrls.map((url) => url?.trim()).filter(Boolean),
            walletAddress: projectMember.walletAddress?.toLowerCase()?.trim(),
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
        name: payload.name,
        walletAddress: payload.walletAddress?.toLowerCase(),
        twitter: payload.twitter,
        // note: the UI sends undefined at first if no website is given
        websites: payload.websites.map((url) => url?.trim()),
        deletedAt: payload.deletedAt
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

  const projectWithMembers = await getProjectById(projectId);

  return projectWithMembers;
}
