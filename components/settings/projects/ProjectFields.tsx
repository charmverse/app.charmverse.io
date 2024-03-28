import { projectFieldProperties } from 'lib/projects/constants';
import type { FieldConfig, ProjectFieldConfig } from 'lib/projects/interfaces';

import { FieldAnswers } from './FormFields/FieldAnswers';
import { FieldsEditor } from './FormFields/FieldsEditor';

export function ProjectFieldAnswers({
  fieldConfig,
  defaultRequired,
  disabled
}: {
  disabled?: boolean;
  fieldConfig?: FieldConfig;
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
  fieldConfig,
  defaultRequired
}: {
  defaultRequired?: boolean;
  onChange?: (value: Omit<ProjectFieldConfig, 'members'>) => void;
  fieldConfig: Omit<ProjectFieldConfig, 'members'>;
}) {
  return (
    <FieldsEditor
      defaultRequired={defaultRequired}
      properties={projectFieldProperties}
      fieldConfig={fieldConfig}
      onChange={onChange}
    />
  );
}
