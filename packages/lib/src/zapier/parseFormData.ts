import type { AddFormResponseInput, FormResponse } from '@packages/lib/zapier/interfaces';

// Data markdown format from zapier:
// ### Question 1?\n\nanswer1\n\n\n### Quesiton2?\n\nanswer2f\n\n\n
export function parseFormData(data: AddFormResponseInput): FormResponse[] {
  try {
    if (Array.isArray(data)) {
      return data.filter((entry) => entry.question);
    }

    if (typeof data !== 'string' && !data.all_responses) {
      // Object with questions as keys and answers as values
      const isValid = Object.values(data).every((value) => typeof value === 'string');
      if (!isValid) {
        return [];
      }

      return Object.entries(data).map(([question, answer]) => ({ question, answer }));
    }

    const questionsStr = typeof data === 'string' ? data : data.all_responses;
    const questionsArr = questionsStr.split('### ').filter(Boolean);

    const questionPairs = questionsArr.map((question) => question.replaceAll(/(\n)+$/g, '').split('\n\n'));

    return questionPairs.map(([q, a]) => ({ question: q.trim(), answer: a.trim() }));
  } catch (e) {
    return [];
  }
}
