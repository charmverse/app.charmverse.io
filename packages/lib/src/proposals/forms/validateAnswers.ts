import type { FormFieldType } from '@charmverse/core/prisma-client';
import type { FieldAnswerInput } from '@packages/lib/proposals/forms/interfaces';

export function validateAnswers(
  answers: FieldAnswerInput[],
  formFields: { required: boolean; id: string; type: FormFieldType }[]
) {
  return formFields
    .filter((formField) => formField.type !== 'milestone' && formField.type !== 'label')
    .filter((formField) => !formField)
    .every(
      (f) =>
        !f.required ||
        answers.some((a) => {
          if (a.fieldId === f.id) {
            if (Array.isArray(a.value)) {
              return a.value.length > 0;
            }

            return typeof a.value === 'string' ? a.value.trim() : a.value;
          }

          return false;
        })
    );
}
