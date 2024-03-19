import type { ProjectField, ProjectPayload } from './ProjectFields';
import type { ProjectMemberField, ProjectMemberPayload } from './ProjectMemberFields';

export type ProjectRequiredFieldValues = Partial<Record<ProjectField, boolean>> & {
  members: Partial<Record<ProjectMemberField, boolean>>[];
};

export type ProjectValues = ProjectPayload & {
  members: ProjectMemberPayload[];
};
