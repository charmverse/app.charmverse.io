import type { PageType } from '@charmverse/core/dist/prisma';
import uniqBy from 'lodash/uniqBy';

import type { BodyFormResponse } from 'lib/typeform/interfaces';
import { isTruthy } from 'lib/utilities/types';

import type { FormResponseProperty } from './interfaces';

export function getPagePath() {
  return `page-${Math.random().toString().replace('0.', '')}`;
}

export function canReceiveManualPermissionUpdates({ pageType }: { pageType: PageType }): boolean {
  if (pageType === 'card_template' || pageType === 'proposal') {
    return false;
  }
  return true;
}

export function transformWebhookBody(data: BodyFormResponse, properties: FormResponseProperty[]) {
  const updatedBody = data.map((b) => {
    const cardProperty = properties.find(
      (prop) => prop.description === b.question.description && prop.type === b.question.type
    );
    if (cardProperty) {
      const newOptions = [...cardProperty.options, ...b.question.options];
      b.question.id = cardProperty.id;
      b.question.name = cardProperty.name;
      b.question.description = cardProperty.description;
      b.question.type = cardProperty.type;
      b.question.options = uniqBy(newOptions, 'value');
    }

    if (b.question.type === 'select' && typeof b.answer === 'string') {
      const optionId = b.question.options.find((o) => o.value === b.answer)?.id;
      if (optionId) {
        b.answer = optionId;
      }
    }

    if (b.question.type === 'multiSelect' && Array.isArray(b.answer)) {
      const transformedAnswer = b.answer
        .map((a) => {
          const optionId = b.question.options.find((o) => o.value === a)?.id;
          if (optionId) {
            return optionId;
          }
          return null;
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
