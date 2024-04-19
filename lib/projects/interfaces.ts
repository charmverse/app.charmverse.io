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
>;

export type ProjectField = keyof ProjectPayload;

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

export type ProjectMemberField = keyof ProjectMemberPayload;

export type FieldConfig = Partial<
  Record<
    string,
    {
      required?: boolean;
      show?: boolean;
      private?: boolean;
    }
  >
>;

export type ProjectAndMembersFieldConfig = FieldConfig & {
  projectMember: FieldConfig;
};

export type ProjectAndMembersPayload = ProjectPayload & {
  // project member with id is for updates existing project members
  // project member without id is for creating new project members
  projectMembers: (ProjectMemberPayload & { id?: string; userId?: string | null })[];
};

export type ProjectFieldProperty = {
  field: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  // This will take precedence over the fieldConfig proposal template author sets
  alwaysRequired?: boolean;
  // This will allow the template author to set the field as private (only visible to authors, reviewers & admins)
  allowPrivate?: boolean;
};

export type ProjectWithMembers = Project & {
  projectMembers: ProjectMember[];
};
