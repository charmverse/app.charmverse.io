import type { Project, ProjectMember } from '@charmverse/core/prisma';

export type ProjectPayload = Pick<
  Project,
  'name' | 'description' | 'twitter' | 'github' | 'websites' | 'walletAddress' | 'deletedAt'
>;

export type ProjectMemberPayload = Pick<ProjectMember, 'email' | 'socialUrls' | 'name' | 'teamLead' | 'walletAddress'>;

export type ProjectAndMembersPayload = ProjectPayload & {
  // project member with id is for updates existing project members
  // project member without id is for creating new project members
  projectMembers: (ProjectMemberPayload & { id?: string; userId?: string | null })[];
};

export type ProjectWithMembers = Project & {
  projectMembers: ProjectMember[];
};
