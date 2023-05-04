import type { Typeform } from '@typeform/api-client';
import { v4 } from 'uuid';

import { createBoardPropertyOptions } from 'components/common/PageLayout/components/Header/components/utils/databasePageOptions';
import type { PropertyType } from 'lib/focalboard/board';
import type { FormResponseProperty } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';

import type { TypeformFields, TypeformResponse } from './interfaces';

function simplifyTypeformQuestions(fields?: TypeformFields[]): FormResponseProperty[] {
  return (fields || [])
    .map(({ id = '', title = '', type, choices = [], allow_multiple_selections: allowMultipleSelections }) => {
      const defaultProperties: FormResponseProperty = {
        id,
        name: title,
        description: title,
        type: 'text',
        options: []
      };

      if (type) {
        switch (type) {
          case 'dropdown':
          case 'short_text':
          case 'long_text':
          case 'payment':
            return { ...defaultProperties, type: 'text' as PropertyType };
          case 'email':
            return { ...defaultProperties, type };
          case 'website':
          case 'file_upload':
            return { ...defaultProperties, type: 'url' as PropertyType };
          case 'number':
          case 'rating':
          case 'opinion_scale':
            return { ...defaultProperties, type: 'number' as PropertyType };
          case 'legal':
          case 'yes_no':
            return { ...defaultProperties, type: 'boolean' as PropertyType };
          case 'phone_number':
            return { ...defaultProperties, type: 'phone' as PropertyType };
          case 'date':
            return { ...defaultProperties, type };
          case 'ranking':
          case 'picture_choice':
          case 'multiple_choice': {
            const options = createBoardPropertyOptions(choices.map((c) => c.label).filter(isTruthy));
            if (allowMultipleSelections) {
              return {
                ...defaultProperties,
                type: 'multiSelect' as PropertyType,
                options
              };
            } else {
              return { ...defaultProperties, type: 'select' as PropertyType, options };
            }
          }
          default:
            return null;
        }
      }
      return null;
    })
    .filter(isTruthy);
}

function simplifyTypeformAnswers(payload: Typeform.Response['answers']) {
  return (payload || [])
    .map(({ field, type, ...answer }) => {
      const id = field?.id;

      switch (type) {
        case 'text':
          return { id, answer: answer.text };
        case 'email':
          return { id, answer: answer.email };
        case 'date':
          return { id, answer: answer.date ? new Date(answer.date).toString() : '' };
        case 'number':
          return { id, answer: answer.number?.toString() };
        case 'boolean':
          return { id, answer: answer.boolean?.toString() };
        case 'url':
          return { id, answer: answer.url };
        case 'file_url': {
          return { id, answer: answer.file_url };
        }
        case 'payment': {
          return { id, answer: `${Object.values(answer.payment ?? {}).join(' ')}` };
        }
        // @ts-ignore - this case is not updated in the typeform api-client lib
        case 'phone_number':
          // @ts-ignore
          return { id, answer: (answer.phone_number as string | undefined) || '' };
        case 'choice':
          return { id, answer: answer.choice?.label || answer.choice?.other };
        case 'choices':
          return {
            id,
            answer: answer.choices?.labels || answer.choices?.other
          };
        default:
          return null;
      }
    })
    .filter(isTruthy)
    .map(({ id, answer }) => ({ id: id || '', answer: answer || '' }));
}

export function simplifyTypeformResponse(payload: TypeformResponse) {
  const questions = simplifyTypeformQuestions(payload.definition?.fields);
  const answers = simplifyTypeformAnswers(payload.answers);

  const qa = questions
    .map((q) => {
      const existingCardProperty = answers?.find((p) => p.id === q.id);
      if (existingCardProperty) {
        const id = v4();
        return { question: { ...q, id }, answer: existingCardProperty.answer };
      }
      return null;
    })
    .filter(isTruthy);

  // Push the submitted date
  qa.push({
    question: { id: v4(), name: 'Submit Date (UTC)', type: 'date', options: [], description: 'Submit Date (UTC)' },
    answer: payload.submitted_at ? new Date(payload.submitted_at).toString() : new Date().toString()
  });

  return qa;
}
