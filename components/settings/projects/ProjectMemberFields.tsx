import { projectMemberFieldProperties } from 'lib/projects/constants';
import type { FieldConfig, ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';

export function ProjectMemberFieldAnswers({
  fieldConfig,
  defaultRequired,
  projectMemberIndex,
  disabled
}: {
  projectMemberIndex: number;
  fieldConfig?: FieldConfig;
  defaultRequired?: boolean;
  disabled?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      disabled={disabled}
      name={`projectMembers[${projectMemberIndex}]`}
      fieldConfig={fieldConfig}
      properties={projectMemberFieldProperties}
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
