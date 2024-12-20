import type { FormField } from '@charmverse/core/prisma-client';
import type { FieldAnswerInput, FormFieldValue, LongTextValue } from '@root/lib/proposals/forms/interfaces';

import type { IPropertyTemplate } from '../board';

export type FormFieldData = Pick<FormField, 'id' | 'type' | 'private'>;
export type FormAnswerData = Pick<FieldAnswerInput, 'value' | 'fieldId'>;

type PropertiesMap = Record<string, FormFieldValue>;

export function getCardPropertiesFromForm({
  formAnswers,
  cardProperties
}: {
  cardProperties: IPropertyTemplate[];
  formAnswers: FormAnswerData[];
}): PropertiesMap {
  const properties: PropertiesMap = {};

  for (const answer of formAnswers) {
    const cardProperty = cardProperties.find((p) => p.formFieldId === answer.fieldId);
    if (cardProperty) {
      const answerValue = answer.value as FormFieldValue;
      if (typeof (answerValue as LongTextValue).contentText === 'string') {
        properties[cardProperty.id] = (answerValue as LongTextValue).contentText;
      } else {
        properties[cardProperty.id] = answerValue ?? '';
      }
    }
  }

  return properties;
}
