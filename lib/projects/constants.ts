import type { Prisma } from '@charmverse/core/prisma-client';

import type { ProjectAndMembersPayload } from './interfaces';

export function createDefaultProjectAndMembersPayload(): ProjectAndMembersPayload {
  return {
    name: '',
    excerpt: '',
    description: '',
    twitter: '',
    website: '',
    github: '',
    blog: '',
    demoUrl: '',
    communityUrl: '',
    otherUrl: '',
    walletAddress: '',
    projectMembers: [
      {
        name: '',
        walletAddress: '',
        email: '',
        twitter: '',
        warpcast: '',
        github: '',
        linkedin: '',
        telegram: '',
        otherUrl: '',
        previousProjects: ''
      }
    ]
  };
}

export const projectInclude = {
  projectMembers: {
    orderBy: [
      {
        teamLead: 'desc'
      },
      {
        createdAt: 'asc'
      }
    ]
  }
} satisfies Prisma.ProjectInclude;
