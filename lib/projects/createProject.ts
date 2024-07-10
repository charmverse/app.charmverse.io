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

  const teamLeads = payload.project.projectMembers.filter((member) => member.teamLead);
  if (teamLeads.length !== 1) {
    throw new InvalidInputError('Exactly one team lead is required');
  }

  const project = payload.project;
  const projectId = v4();

  const projectMembersCreatePayload = await Promise.all(
    project.projectMembers.map(async (member) => {
      const connectedUserId = member.teamLead ? payload.userId : await findCharmVerseUserIdWithProjectMember(member);
      if (!member.teamLead) {
        trackUserAction('add_project_member', {
          userId: payload.userId,
          projectId,
          connectedUserId,
          email: member.email,
          walletAddress: member.walletAddress
        });
      }

      return {
        ...member,
        userId: connectedUserId,
        updatedBy: payload.userId
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
          data: projectMembersCreatePayload
        }
      }
    },
    include: projectInclude
  });

  return projectWithMembers;
}
