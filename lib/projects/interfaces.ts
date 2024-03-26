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
  | 'productUrl'
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

export type ProjectFieldConfig = Partial<
  Record<
    string,
    {
      required?: boolean;
      hidden?: boolean;
    }
  >
>;

export type ProjectEditorFieldConfig = ProjectFieldConfig & {
  projectMember: ProjectFieldConfig;
};

export type ProjectValues = ProjectPayload & {
  projectMembers: ProjectMemberPayload[];
};

export type ProjectUpdatePayload = Partial<ProjectPayload> & {
  id: string;
  projectMembers: (Partial<ProjectMemberPayload> & { id: string })[];
};

export type ProjectFieldProperty = {
  field: string;
  label: string;
  multiline?: boolean;
  rows?: number;
};

export type ProjectWithMembers = Project & {
  projectMembers: ProjectMember[];
};
