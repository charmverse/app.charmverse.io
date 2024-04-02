import { useFormContext } from 'react-hook-form';

import { projectMemberFieldProperties } from 'lib/projects/constants';
import type { FieldConfig, ProjectAndMembersFieldConfig, ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';

export function ProjectMemberFieldAnswers({
  fieldConfig,
  defaultRequired,
  projectMemberIndex,
  disabled,
  onChange
}: {
  projectMemberIndex: number;
  fieldConfig?: FieldConfig;
  defaultRequired?: boolean;
  disabled?: boolean;
  onChange?: (projectAndMembersPayload: ProjectAndMembersPayload) => any;
}) {
  const { getValues } = useFormContext<ProjectAndMembersPayload>();

  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      disabled={disabled}
      name={`projectMembers[${projectMemberIndex}]`}
      fieldConfig={fieldConfig}
      properties={projectMemberFieldProperties}
      onChange={(updatedProjectMemberPayload) => {
        const projectWithMembers = getValues();
        const updatedProjectMembers = projectWithMembers.projectMembers.map((projectMember, index) =>
          index === projectMemberIndex ? { ...projectMember, ...updatedProjectMemberPayload } : projectMember
        );
        onChange?.({
          ...projectWithMembers,
          projectMembers: updatedProjectMembers
        });
      }}
    />
  );
}

export function ProjectMemberFieldsEditor({
  onChange,
  fieldConfig,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (values: ProjectAndMembersFieldConfig['projectMember']) => void;
  fieldConfig: ProjectAndMembersFieldConfig['projectMember'];
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={projectMemberFieldProperties}
      fieldConfig={fieldConfig}
      onChange={onChange}
      isProjectMember
    />
  );
}
