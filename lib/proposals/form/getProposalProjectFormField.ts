import { cloneDeep } from 'lodash';

import { defaultProjectFieldConfig } from 'lib/projects/constants';
import type { ProjectField, ProjectFieldConfig, ProjectMemberField, ProjectWithMembers } from 'lib/projects/interfaces';

export function getProposalProjectFormField({
  canViewPrivateFields,
  projectWithMembers,
  fieldConfig = defaultProjectFieldConfig
}: {
  fieldConfig?: ProjectFieldConfig;
  projectWithMembers: ProjectWithMembers;
  canViewPrivateFields: boolean;
}) {
  const projectWithoutPrivateFields = cloneDeep(projectWithMembers);
  const privateProjectFields = Object.entries(fieldConfig)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectField[];

  const privateProjectMemberFields = Object.entries(fieldConfig.projectMember)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectMemberField[];

  (Object.keys(projectWithoutPrivateFields) as ProjectField[]).forEach((key) => {
    if (privateProjectFields.includes(key) && !canViewPrivateFields) {
      projectWithoutPrivateFields[key] = '';
    }
  });

  projectWithoutPrivateFields.projectMembers.forEach((projectMember, index) => {
    (Object.keys(projectMember) as ProjectMemberField[]).forEach((key) => {
      if (privateProjectMemberFields.includes(key) && !canViewPrivateFields) {
        projectMember[key] = '';
      }
    });
    projectWithoutPrivateFields.projectMembers[index] = projectMember;
  });

  return projectWithoutPrivateFields;
}
