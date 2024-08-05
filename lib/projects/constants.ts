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
    projectMembers: []
  };
}

type ProjectMemberPayload = ProjectAndMembersPayload['projectMembers'][number];

export function defaultProjectMember({
  walletAddress = '',
  email = '',
  github = '',
  linkedin = '',
  name = '',
  telegram = '',
  twitter = '',
  teamLead = false,
  userId
}: Partial<
  Pick<
    ProjectMemberPayload,
    'email' | 'github' | 'linkedin' | 'name' | 'teamLead' | 'telegram' | 'twitter' | 'userId' | 'walletAddress'
  >
> = {}): ProjectMemberPayload {
  return {
    name,
    teamLead,
    walletAddress,
    email,
    twitter,
    warpcast: '',
    github,
    linkedin,
    telegram,
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
