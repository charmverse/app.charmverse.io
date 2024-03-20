import type { ProjectField, ProjectPayload } from './ProjectFields';
import type { ProjectMemberField, ProjectMemberPayload } from './ProjectMemberFields';

export type ProjectFieldConfig<Fields extends string = string> = Record<
  Fields,
  {
    required?: boolean;
    hidden?: boolean;
  }
>;

export type ProjectEditorFieldConfig = Partial<ProjectFieldConfig<ProjectField>> & {
  members: ProjectFieldConfig<ProjectMemberField>[];
};

export type ProjectValues = ProjectPayload & {
  members: ProjectMemberPayload[];
};
