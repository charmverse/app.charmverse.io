import type { Project, ProjectMember } from '@charmverse/core/prisma-client';

import type { ProjectField, ProjectPayload } from './ProjectFields';
import type { ProjectMemberField, ProjectMemberPayload } from './ProjectMemberFields';

export type ProjectFieldConfig<Fields extends string = string> = Partial<
  Record<
    Fields,
    {
      required?: boolean;
      hidden?: boolean;
    }
  >
>;

export type ProjectEditorFieldConfig = ProjectFieldConfig<ProjectField> & {
  projectMembers: ProjectFieldConfig<ProjectMemberField>[];
};

export type ProjectValues = ProjectPayload & {
  projectMembers: ProjectMemberPayload[];
};

export type ProjectUpdatePayload = Partial<ProjectPayload> & {
  id: string;
  projectMembers: (Partial<ProjectMemberPayload> & { id: string })[];
};

export type ProjectFieldProperty<Fields> = {
  field: Fields;
  required: boolean;
  label: string;
  multiline?: boolean;
  rows?: number;
};

export type ProjectWithMembers = Project & {
  projectMembers: ProjectMember[];
};
