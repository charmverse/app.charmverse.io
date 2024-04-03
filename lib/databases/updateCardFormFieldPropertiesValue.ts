import type { FormField, FormFieldAnswer } from '@charmverse/core/prisma-client';

import type { FormFieldValue } from 'components/common/form/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { BoardPropertyValue } from 'lib/public-api/interfaces';

import type { IPropertyTemplate } from './board';

const excludedFieldTypes = ['project_profile', 'label'];

export function updateCardFormFieldPropertiesValue({
  accessPrivateFields,
  formFields,
  cardProperties,
  proposalId
}: {
  cardProperties: IPropertyTemplate[];
  accessPrivateFields: boolean;
  formFields: (Pick<FormField, 'id' | 'type' | 'private'> & {
    answers: Pick<FormFieldAnswer, 'value' | 'proposalId'>[];
  })[];
  proposalId: string;
}) {
  const properties: Record<string, BoardPropertyValue> = {};

  const filteredFormFields = accessPrivateFields ? formFields : formFields.filter((formField) => !formField.private);

  for (const formField of filteredFormFields) {
    const cardProperty = cardProperties.find((p) => p.formFieldId === formField.id);
    const answerValue = formField.answers.find((ans) => ans.proposalId === proposalId)?.value as FormFieldValue;
    // exclude some field types
    if (!excludedFieldTypes.includes(formField.type) && cardProperty) {
      if (formField.type === 'long_text') {
        properties[cardProperty.id] =
          (
            answerValue as {
              content: PageContent;
              contentText: string;
            }
          )?.contentText ?? '';
      } else {
        properties[cardProperty.id] = answerValue ?? '';
      }
    }
  }

  return properties;
}
