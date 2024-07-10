import type { Prisma } from '@charmverse/core/prisma';

import type { ProjectAndMembersPayload } from './interfaces';

export function createDefaultProjectAndMembersPayload(): ProjectAndMembersPayload {
  return {
    name: '',
    deletedAt: null,
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
    projectMembers: [defaultProjectMember({ teamLead: true })]
  };
}

export function defaultProjectMember({
  walletAddress = '',
  email = '',
  name = '',
  teamLead = false,
  userId
}: {
  email?: string;
  name?: string;
  walletAddress?: string;
  teamLead?: boolean;
  userId?: string;
} = {}): ProjectAndMembersPayload['projectMembers'][number] {
  return {
    name,
    teamLead,
    walletAddress,
    email,
    twitter: '',
    warpcast: '',
    github: '',
    linkedin: '',
    telegram: '',
    otherUrl: '',
    previousProjects: '',
    userId
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
