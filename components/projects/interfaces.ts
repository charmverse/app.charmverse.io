import type { ProjectField } from './ProjectFields';
import type { ProjectMemberField } from './ProjectMemberFields';

export type ProjectFormWithRequiredTogglesValues = Partial<Record<ProjectField, boolean>> & {
  members: Partial<Record<ProjectMemberField, boolean>>[];
};
