import { randomBoardColor } from '@packages/databases/constants';
import { isTruthy } from '@packages/utils/types';
import uniqBy from 'lodash/uniqBy';
import { v4 as uuid } from 'uuid';

import type { PageProperty } from '../public-api';

import type { BodyFormResponse } from './interfaces';

export function transformWebhookBodyFormResponse(data: BodyFormResponse, properties: PageProperty[]) {
  const updatedBody = data.map((b) => {
    const cardProperty = properties.find(
      (prop) => prop.description === b.question.description && prop.type === b.question.type
    );
    if (cardProperty) {
      const newOptions = [...(cardProperty.options ?? []), ...(b.question.options ?? [])];
      b.question.id = cardProperty.id;
      b.question.name = cardProperty.name;
      b.question.description = cardProperty.description;
      b.question.type = cardProperty.type;
      b.question.options = uniqBy(newOptions, 'value');
    }

    if (b.question.type === 'select' && typeof b.answer === 'string') {
      const optionId = b.question.options?.find((o) => o.value === b.answer)?.id;
      if (optionId) {
        b.answer = optionId;
      } else {
        const newOptionId = uuid();
        b.question.options?.push({ id: newOptionId, value: b.answer, color: randomBoardColor() });
      }
    }

    if (b.question.type === 'multiSelect' && Array.isArray(b.answer)) {
      const transformedAnswer = b.answer
        .map((a) => {
          const optionId = b.question.options?.find((o) => o.value === a)?.id;
          if (optionId) {
            return optionId;
          } else {
            const newOptionId = uuid();
            b.question.options.push({ id: newOptionId, value: a, color: randomBoardColor() });
            return newOptionId;
          }
        })
        .filter(isTruthy);
      b.answer = transformedAnswer;
    }
    return b;
  });

  const otherCardProperties = properties.filter(
    (prop) => !updatedBody.find((q) => prop.description === q.question.description && prop.type === q.question.type)
  );

  const allProperties = [...updatedBody.map((b) => b.question), ...otherCardProperties];

  return { allProperties, updatedBody };
}
