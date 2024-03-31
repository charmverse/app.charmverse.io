import { cloneDeep } from 'lodash';

import { defaultProjectFieldConfig } from 'lib/projects/constants';
import type { ProjectField, ProjectFieldConfig, ProjectMemberField, ProjectWithMembers } from 'lib/projects/interfaces';
import { isTruthy } from 'lib/utils/types';

export function getProposalProjectFormField({
  canViewPrivateFields,
  projectWithMembers,
  fieldConfig = defaultProjectFieldConfig
}: {
  fieldConfig?: ProjectFieldConfig;
  projectWithMembers: ProjectWithMembers | null | undefined;
  canViewPrivateFields: boolean;
}) {
  if (!projectWithMembers) {
    return null;
  }

  const clonedProject = cloneDeep(projectWithMembers);
  const privateProjectFields = Object.entries(fieldConfig)
    .filter(([, config]) => config?.hidden === false)
    ?.filter(isTruthy)
    .map(([key]) => key) as ProjectField[];

  const privateProjectMemberFields = Object.entries(fieldConfig.projectMember)
    .filter(([, config]) => config?.hidden === false)
    ?.filter(isTruthy)
    .map(([key]) => key) as ProjectMemberField[];

  (Object.keys(clonedProject) as ProjectField[]).forEach((key) => {
    if (privateProjectFields.includes(key) && !canViewPrivateFields) {
      clonedProject[key] = '';
    }
  });

  clonedProject.projectMembers.forEach((member) => {
    (Object.keys(member) as ProjectMemberField[]).forEach((key) => {
      if (privateProjectMemberFields.includes(key) && !canViewPrivateFields) {
        member[key] = '';
      }
    });
  });

  return clonedProject;
}
