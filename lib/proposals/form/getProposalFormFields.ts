import type { FormFieldInput } from 'components/common/form/interfaces';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';

export function getProposalFormFields(fields: FormFieldInput[] | null | undefined, canViewPrivateFields: boolean) {
  if (!fields) {
    return null;
  }
  if (canViewPrivateFields) {
    return fields;
  }
  fields.forEach((field) => {
    if (field.type === 'project_profile') {
      const fieldConfig = field.fieldConfig as ProjectAndMembersFieldConfig;
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
  });

  return canViewPrivateFields ? fields : fields.filter((field) => !field.private);
}
