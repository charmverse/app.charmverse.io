import { projectMemberFieldProperties } from 'lib/projects/formField';
import type { FieldConfig, ProjectAndMembersFieldConfig } from 'lib/projects/formField';

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
  onChange?: (projectMemberPayload: Record<string, any>) => any;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      disabled={disabled}
      name={`projectMembers[${projectMemberIndex}]`}
      fieldConfig={fieldConfig}
      properties={projectMemberFieldProperties}
      onChange={onChange}
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
