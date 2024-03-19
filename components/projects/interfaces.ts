import type { ProjectField, ProjectPayload } from './ProjectFields';
import type { ProjectMemberField, ProjectMemberPayload } from './ProjectMemberFields';

export type ProjectFormWithRequiredTogglesValues = Partial<Record<ProjectField, boolean>> & {
  members: Partial<Record<ProjectMemberField, boolean>>[];
};

export type ProjectFormValues = ProjectPayload & {
  members: ProjectMemberPayload[];
};
