import type { Project, ProjectMember } from '@charmverse/core/prisma-client';

export type ProjectPayload = Pick<
  Project,
  | 'name'
  | 'excerpt'
  | 'description'
  | 'twitter'
  | 'website'
  | 'github'
  | 'blog'
  | 'demoUrl'
  | 'communityUrl'
  | 'otherUrl'
  | 'walletAddress'
  | 'deletedAt'
>;

export type ProjectMemberPayload = Pick<
  ProjectMember,
  | 'email'
  | 'github'
  | 'linkedin'
  | 'name'
  | 'otherUrl'
  | 'previousProjects'
  | 'telegram'
  | 'twitter'
  | 'walletAddress'
  | 'warpcast'
>;

export type ProjectAndMembersPayload = ProjectPayload & {
  // project member with id is for updates existing project members
  // project member without id is for creating new project members
  projectMembers: (ProjectMemberPayload & { id?: string; userId?: string | null })[];
};

export type ProjectWithMembers = Project & {
  projectMembers: ProjectMember[];
};
