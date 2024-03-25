import type { Project, ProjectMember } from '@charmverse/core/prisma-client';

import type { ProjectPayload } from './ProjectFields';
import type { ProjectMemberPayload } from './ProjectMemberFields';

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

export const defaultProjectFieldConfig = {
  name: {
    required: true
  },
  projectMember: {
    name: {
      required: true
    }
  }
};
