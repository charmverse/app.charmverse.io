import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';

import { projectInclude } from './constants';
import { findCharmVerseUserIdWithProjectMember } from './getProjectMemberCreateTransaction';
import type { ProjectAndMembersPayload, ProjectWithMembers } from './interfaces';

export async function createProject(payload: {
  userId: string;
  project: ProjectAndMembersPayload;
}): Promise<ProjectWithMembers> {
  if (payload.project.projectMembers.length === 0) {
    throw new InvalidInputError('At least one member is required');
  }

  const project = payload.project;
  const projectLead = project.projectMembers[0];
  const projectMembers = project.projectMembers.slice(1);
  const projectId = v4();

  const projectMembersCreatePayload = await Promise.all(
    projectMembers.map(async (projectMemberPayload) => {
      const charmVerseUserIdWithProjectMember = await findCharmVerseUserIdWithProjectMember(projectMemberPayload);
      trackUserAction('add_project_member', {
        userId: payload.userId,
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

  const projectWithMembers = await prisma.project.create({
    data: {
      id: projectId,
      description: project.description,
      excerpt: project.excerpt,
      name: project.name,
      walletAddress: project.walletAddress?.toLowerCase(),
      blog: project.blog,
      communityUrl: project.communityUrl,
      github: project.github,
      otherUrl: project.otherUrl,
      demoUrl: project.demoUrl,
      twitter: project.twitter,
      website: project.website,
      createdBy: payload.userId,
      updatedBy: payload.userId,
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: payload.userId,
              userId: payload.userId,
              ...projectLead
            },
            ...projectMembersCreatePayload.map(({ connectedUserId, projectMember }) => ({
              updatedBy: payload.userId,
              userId: connectedUserId,
              ...projectMember
            }))
          ]
        }
      }
    },
    include: projectInclude
  });

  return projectWithMembers;
}
