import { projectMemberFieldProperties } from 'lib/projects/constants';
import type { ProjectEditorFieldConfig, ProjectFieldConfig } from 'lib/projects/interfaces';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';

export function ProjectMemberFieldAnswers({
  fieldConfig,
  defaultRequired,
  projectMemberIndex,
  disabled
}: {
  projectMemberIndex: number;
  fieldConfig?: ProjectFieldConfig;
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
  values,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (values: ProjectEditorFieldConfig['projectMember']) => void;
  values: ProjectEditorFieldConfig['projectMember'];
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={projectMemberFieldProperties}
      values={values}
      onChange={onChange}
      isProjectMember
    />
  );
}
