import type { ProjectField, ProjectFieldConfig, ProjectMemberField, ProjectWithMembers } from 'lib/projects/interfaces';

export function getProposalProjectFormField({
  canViewPrivateFields,
  projectWithMembers,
  fieldConfig
}: {
  fieldConfig: ProjectFieldConfig;
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
      projectWithMembers[key] = '';
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
