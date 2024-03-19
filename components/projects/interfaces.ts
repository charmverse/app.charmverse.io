import type { ProjectField, ProjectPayload } from './ProjectFields';
import type { ProjectMemberField, ProjectMemberPayload } from './ProjectMemberFields';

export type ProjectEditorFieldConfig = Partial<
  Record<
    ProjectField,
    {
      required?: boolean;
      hidden?: boolean;
    }
  >
> & {
  members: Partial<
    Record<
      ProjectMemberField,
      {
        required?: boolean;
        hidden?: boolean;
      }
    >
  >[];
};

export type ProjectValues = ProjectPayload & {
  members: ProjectMemberPayload[];
};
