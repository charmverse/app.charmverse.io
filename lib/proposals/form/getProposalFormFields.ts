import type { FormFieldInput } from '@root/lib/forms/interfaces';
import type { ProjectAndMembersFieldConfig } from '@root/lib/projects/formField';
import { createDefaultProjectAndMembersFieldConfig } from '@root/lib/projects/formField';

export function getProposalFormFields(fields: FormFieldInput[] | null | undefined, canViewPrivateFields: boolean) {
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

  return canViewPrivateFields ? fields : fields.filter((field) => !field.private);
}
