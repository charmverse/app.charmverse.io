import type { FormFieldInput } from './interfaces';

export function checkFormFieldErrors(formFields: FormFieldInput[]): string | undefined {
  if (formFields.length === 0) {
    return 'Form fields are required for structured proposals';
  } else if (formFields.some((formField) => !formField.name)) {
    return 'Form fields must have a name';
  } else if (
    formFields.some(
      (formField) =>
        (formField.type === 'select' || formField.type === 'multiselect') && (formField.options ?? []).length === 0
    )
  ) {
    return 'Select fields must have atleast one option';
  }
  return undefined;
}
