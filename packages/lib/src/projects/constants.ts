import type { Prisma } from '@charmverse/core/prisma';

import type { ProjectAndMembersPayload } from './interfaces';

export function createDefaultProjectAndMembersPayload(): ProjectAndMembersPayload {
  return {
    ...createDefaultProject(),
    projectMembers: [defaultProjectMember({ teamLead: true })]
  };
}

export function createDefaultProject(): ProjectAndMembersPayload {
  return {
    name: '',
    deletedAt: null,
    description: '',
    twitter: '',
    github: '',
    websites: [],
    walletAddress: '',
    projectMembers: []
  };
}

type ProjectMemberPayload = ProjectAndMembersPayload['projectMembers'][number];

export function defaultProjectMember({
  walletAddress = '',
  email = '',
  socialUrls = [],
  name = '',
  teamLead = false,
  userId
}: Partial<
  Pick<ProjectMemberPayload, 'email' | 'name' | 'teamLead' | 'socialUrls' | 'userId' | 'walletAddress'>
> = {}): ProjectMemberPayload {
  return {
    name,
    teamLead,
    walletAddress,
    email,
    socialUrls,
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
