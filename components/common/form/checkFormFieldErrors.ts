import type { FormFieldType } from '@charmverse/core/prisma-client';
import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';

import { nonDuplicateFieldTypes } from './constants';

export function checkFormFieldErrors(formFields: FormFieldInput[]): string | undefined {
  if (formFields.length === 0) {
    return 'Form fields are required for structured proposals';
  } else if (formFields.some((formField) => formField.type !== 'project_profile' && !formField.name)) {
    return 'Form fields must have a name';
  } else if (
    formFields.some(
      (formField) =>
        (formField.type === 'select' || formField.type === 'multiselect') && (formField.options ?? []).length === 0
    )
  ) {
    return 'Select fields must have at least one option';
  }

  const formFieldTypeFrequencyCount = formFields.reduce(
    (acc, formField) => {
      if (formField.type in acc) {
        acc[formField.type] += 1;
      } else {
        acc[formField.type] = 1;
      }
      return acc;
    },
    {} as Record<FormFieldType, number>
  );

  const duplicatedFieldType = nonDuplicateFieldTypes.find(
    (nonDuplicateFieldType) => formFieldTypeFrequencyCount[nonDuplicateFieldType] > 1
  );

  if (duplicatedFieldType) {
    return `You can only have one ${duplicatedFieldType} field`;
  }

  return undefined;
}
