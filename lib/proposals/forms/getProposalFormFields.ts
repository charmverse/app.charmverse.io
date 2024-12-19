import type { ProjectAndMembersFieldConfig } from '@root/lib/projects/formField';
import { createDefaultProjectAndMembersFieldConfig } from '@root/lib/projects/formField';
import type { FormFieldInput, TypedFormField } from '@root/lib/proposals/forms/interfaces';

export function getProposalFormFields({
  fields,
  canViewPrivateFields,
  currentEvaluationIndex
}: {
  fields: FormFieldInput[] | null | undefined;
  canViewPrivateFields: boolean;
  currentEvaluationIndex?: number;
}): TypedFormField[] | null {
  if (!fields) {
    return null;
  }
  fields.forEach((field) => {
    if (field.type === 'project_profile') {
      // grab default properties for fields
      const configDefaults = createDefaultProjectAndMembersFieldConfig({ allFieldsRequired: true });
      const savedFieldConfig = field.fieldConfig as ProjectAndMembersFieldConfig;
      const fieldConfig: ProjectAndMembersFieldConfig = {
        ...configDefaults,
        ...savedFieldConfig,
        projectMember: {
          ...configDefaults.projectMember,
          ...savedFieldConfig.projectMember
        }
      };
      if (!canViewPrivateFields) {
        for (const subField of Object.values(fieldConfig)) {
          if (subField.private) {
            subField.show = false;
          }
        }
        for (const subField of Object.values(fieldConfig.projectMember)) {
          if (subField.private) {
            subField.show = false;
          }
        }
      }
      Object.assign(field, { fieldConfig });
    }
  });
  const filtered = canViewPrivateFields ? fields : fields.filter((field) => !field.private);
  return filtered.map((field) => {
    //  logic whether a field should be hidden based on evaluationsUpToCurrent
    const isHiddenByDependency = Boolean(
      typeof currentEvaluationIndex === 'number' &&
        typeof field.dependsOnStepIndex === 'number' &&
        field.dependsOnStepIndex > currentEvaluationIndex
    );
    return {
      ...field,
      isHiddenByDependency
    } as TypedFormField;
  });
}
