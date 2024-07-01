import { projectMemberFieldProperties } from 'lib/projects/formField';
import type { FieldConfig, ProjectAndMembersFieldConfig } from 'lib/projects/formField';

import { FieldAnswers } from './FieldAnswers';
import { FieldsEditor } from './FieldsEditor';

export function ProjectMemberFieldAnswers({
  fieldConfig,
  projectMemberIndex,
  disabled,
  onChange
}: {
  projectMemberIndex: number;
  fieldConfig?: FieldConfig;
  disabled?: boolean;
  onChange?: (projectMemberPayload: Record<string, any>) => any;
}) {
  return (
    <FieldAnswers
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
