import type { ProjectField, ProjectAndMembersFieldConfig, ProjectMemberField } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

export function getProposalProjectFormField({
  canViewPrivateFields,
  projectWithMembers,
  fieldConfig
}: {
  fieldConfig: ProjectAndMembersFieldConfig;
  projectWithMembers: ProjectWithMembers;
  canViewPrivateFields: boolean;
}) {
  if (canViewPrivateFields) return projectWithMembers;

  const privateProjectFields = Object.entries(fieldConfig)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectField[];

  const privateProjectMemberFields = Object.entries(fieldConfig.projectMember)
    .filter(([, config]) => config?.private === true)
    .map(([key]) => key) as ProjectMemberField[];

  privateProjectFields.forEach((key) => {
    if (key in projectWithMembers) {
      if (key === 'deletedAt') {
        projectWithMembers[key] = null;
      } else {
        projectWithMembers[key] = '';
      }
    }
  });

  projectWithMembers.projectMembers.forEach((projectMember) => {
    privateProjectMemberFields.forEach((key) => {
      if (key in projectMember) {
        projectMember[key] = '';
      }
    });
  });

  return projectWithMembers;
}
