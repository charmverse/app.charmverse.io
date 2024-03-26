import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectValues, ProjectWithMembers } from './interfaces';

export async function createProject(payload: { userId: string; project: ProjectValues }): Promise<ProjectWithMembers> {
  if (payload.project.projectMembers.length === 0) {
    throw new InvalidInputError('At least one member is required');
  }

  const project = payload.project;
  const projectLeadMember = project.projectMembers[0];

  const createdProjectWithMembers = await prisma.project.create({
    data: {
      description: project.description,
      excerpt: project.excerpt,
      name: project.name,
      walletAddress: project.walletAddress,
      blog: project.blog,
      communityUrl: project.communityUrl,
      github: project.github,
      otherUrl: project.otherUrl,
      productUrl: project.productUrl,
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
              ...projectLeadMember
            },
            ...project.projectMembers.slice(1).map((member) => ({
              updatedBy: payload.userId,
              ...member
            }))
          ]
        }
      }
    },
    include: {
      projectMembers: true
    }
  });

  return {
    ...createdProjectWithMembers,
    projectMembers: createdProjectWithMembers.projectMembers
  };
}
