import { v4 as uuid } from 'uuid';

import type { FormFieldInput } from 'lib/forms/interfaces';
import type { FieldConfig, ProjectFieldConfig } from 'lib/projects/formField';
import {
  createDefaultProjectAndMembersFieldConfig,
  projectMemberFieldProperties,
  projectFieldProperties
} from 'lib/projects/formField';

export type ProjectAndMembersFieldConfig = Record<string, ProjectFieldConfig | FieldConfig>;

export function getFormInput(input: Partial<FormFieldInput>): FormFieldInput {
  return {
    id: uuid(),
    type: 'short_text',
    name: 'name',
    description: '',
    index: 0,
    options: [],
    private: false,
    required: true,
    fieldConfig: {},
    ...input
  };
}

export function getProjectProfileFieldConfig(
  fieldConfig: ProjectAndMembersFieldConfig = {}
): ProjectAndMembersFieldConfig {
  const defaults = createDefaultProjectAndMembersFieldConfig();
  return {
    ...defaults,
    ...fieldConfig,
    projectMember: {
      ...defaults.projectMember,
      ...(fieldConfig.projectMember || {})
    }
  };
}

// get project profile field config with all fields hidden
export function getProjectProfileFieldConfigDefaultHidden(
  fieldConfig: ProjectAndMembersFieldConfig = {}
): ProjectAndMembersFieldConfig {
  const defaults = createDefaultProjectAndMembersFieldConfig();
  projectFieldProperties.forEach((property) => {
    defaults[property.field] = defaults[property.field] || {};
    defaults[property.field]!.show = false;
  });
  projectMemberFieldProperties.forEach((property) => {
    defaults.projectMember[property.field] = defaults.projectMember[property.field] || {};
    defaults.projectMember[property.field]!.show = false;
  });
  return {
    ...defaults,
    ...fieldConfig,
    projectMember: {
      ...defaults.projectMember,
      ...(fieldConfig.projectMember || {})
    }
  };
}
