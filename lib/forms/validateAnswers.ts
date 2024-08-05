import type { FormFieldType } from '@charmverse/core/prisma-client';
import type { FieldAnswerInput } from '@root/lib/forms/interfaces';

export function validateAnswers(
  answers: FieldAnswerInput[],
  formFields: { required: boolean; id: string; type: FormFieldType }[]
) {
  const answerFieldIds = answers.map((a) => a.fieldId);
  return formFields
    .filter(
      (formField) =>
        formField.type !== 'milestone' && formField.type !== 'label' && answerFieldIds.includes(formField.id)
    )
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
