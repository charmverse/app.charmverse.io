import type { FieldAnswerInput } from 'lib/forms/interfaces';

export function validateAnswers(answers: FieldAnswerInput[], formFields: { required: boolean; id: string }[]) {
  return formFields.every(
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
