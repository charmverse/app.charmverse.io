import type { Typeform } from '@typeform/api-client';

import { isTruthy } from 'lib/utilities/types';

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
          return { id, answer: answer.date };
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
        case 'choice':
          return { id, answer: answer.choice?.label || answer.choice?.other };
        case 'choices':
          return {
            id,
            answer: answer.choices?.other || answer.choices?.labels?.join(', ')
          };
        default:
          return null;
      }
    })
    .filter(isTruthy)
    .map(({ id, answer }) => ({ id: id || '', answer: answer || '' }));
}

export function simplifyTypeformResponse(payload: Typeform.Response) {
  const questions = (payload.definition?.fields || [])
    .map((field) => ({ id: field.id ?? '', question: field.title ?? '' }))
    .filter((field) => !!field.id && !!field.question)
    .reduce<Record<string, string>>((acc, val) => {
      acc[val.id] = val.question;
      return acc;
    }, {});

  const answers = simplifyTypeformAnswers(payload.answers);

  const mappedQuestionsAndAnswers = answers
    .map((a) => {
      if (questions[a.id]) {
        return {
          question: questions[a.id],
          answer: a.answer
        };
      }
      return null;
    })
    .filter(isTruthy);

  mappedQuestionsAndAnswers.unshift({
    question: 'Created at',
    answer: payload.submitted_at ? new Date(payload.submitted_at).toString() : new Date().toString()
  });

  return mappedQuestionsAndAnswers;
}
