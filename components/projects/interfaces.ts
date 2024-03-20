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
  members: ProjectFieldConfig<ProjectMemberField>[];
};

export type ProjectValues = ProjectPayload & {
  members: ProjectMemberPayload[];
};

export type ProjectFieldProperty<Fields> = {
  field: Fields;
  required: boolean;
  label: string;
  multiline?: boolean;
  rows?: number;
};
