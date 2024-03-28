import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getProjectMemberCreateTransaction } from './getProjectMemberCreateTransaction';
import type { ProjectValues, ProjectWithMembers } from './interfaces';

export async function createProject(payload: { userId: string; project: ProjectValues }): Promise<ProjectWithMembers> {
  if (payload.project.projectMembers.length === 0) {
    throw new InvalidInputError('At least one member is required');
  }

  const project = payload.project;
  const projectLead = project.projectMembers[0];
  const projectMembers = project.projectMembers.slice(1);

  const createdProjectWithMembers = await prisma.project.create({
    data: {
      description: project.description,
      excerpt: project.excerpt,
      name: project.name,
      walletAddress: project.walletAddress.toLowerCase(),
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
            }
          ]
        }
      }
    },
    select: {
      id: true
    }
  });

  const projectMemberTransactions: Prisma.Prisma__ProjectMemberClient<ProjectMember, never>[] = [];

  for (const projectMember of projectMembers) {
    projectMemberTransactions.push(
      (
        await getProjectMemberCreateTransaction({
          projectId: createdProjectWithMembers.id,
          userId: payload.userId,
          projectMember
        })
      )()
    );
  }

  await prisma.$transaction(projectMemberTransactions);

  const projectWithMembers = await prisma.project.findUniqueOrThrow({
    where: {
      id: createdProjectWithMembers.id
    },
    include: {
      projectMembers: true
    }
  });

  return projectWithMembers;
}
