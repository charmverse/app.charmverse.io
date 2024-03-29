import { projectFieldProperties } from 'lib/projects/constants';
import type { ProjectEditorFieldConfig, ProjectFieldConfig } from 'lib/projects/interfaces';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';

export function ProjectFieldAnswers({
  fieldConfig,
  defaultRequired,
  disabled
}: {
  disabled?: boolean;
  fieldConfig?: ProjectFieldConfig;
  defaultRequired?: boolean;
}) {
  return (
    <FieldAnswers
      defaultRequired={defaultRequired}
      disabled={disabled}
      fieldConfig={fieldConfig}
      properties={projectFieldProperties}
    />
  );
}

export function ProjectFieldsEditor({
  onChange,
  values,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (value: Omit<ProjectEditorFieldConfig, 'members'>) => void;
  values: Omit<ProjectEditorFieldConfig, 'members'>;
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={projectFieldProperties}
      values={values}
      onChange={onChange}
    />
  );
}
