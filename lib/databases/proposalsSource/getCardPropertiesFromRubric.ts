import type { AnswerData } from 'lib/proposals/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposals/rubric/aggregateResults';

import type { IPropertyTemplate } from '../board';
import type { CardPropertyValue } from '../card';

export function getCardPropertiesFromRubric({
  properties,
  templates,
  rubricAnswers,
  rubricCriteria,
  step
}: {
  properties: Record<string, CardPropertyValue>;
  templates: IPropertyTemplate[];
  rubricCriteria: { id: string; title: string }[];
  rubricAnswers: AnswerData[];
  step: { id: string; title: string };
}): Record<string, CardPropertyValue> {
  const { allScores, reviewersResults } = aggregateResults({
    answers: rubricAnswers.filter((a) => a.evaluationId === step.id),
    criteria: rubricCriteria.filter((c) => c.id !== step.id)
  });

  const rubricStepScore: Record<string, number> = {};

  rubricCriteria.forEach((criteria) => {
    const totalScore = rubricAnswers
      .filter((a) => a.rubricCriteriaId === criteria.id)
      .reduce((acc, answer) => {
        if (answer.response.score) {
          acc += answer.response.score;
        }
        return acc;
      }, 0);

    rubricStepScore[criteria.title] = (rubricStepScore[criteria.title] ?? 0) + totalScore;
  });

  templates.forEach((template) => {
    if (template.type === 'proposalRubricCriteriaTotal') {
      properties[template.id] = ((properties[template.id] as number) ?? 0) + (rubricStepScore[template.name] ?? 0);
    }
  });

  const uniqueReviewers = Object.keys(reviewersResults);

  const proposalEvaluatedByProp = templates.find((p) => p.type === 'proposalEvaluatedBy' && p.name === step.title);
  const proposalEvaluationTotalProp = templates.find(
    (p) => p.type === 'proposalEvaluationTotal' && p.name === step.title
  );
  const proposalEvaluationAverageProp = templates.find(
    (p) => p.type === 'proposalEvaluationAverage' && p.name === step.title
  );

  if (proposalEvaluatedByProp) {
    properties[proposalEvaluatedByProp.id] = uniqueReviewers;
  }

  if (proposalEvaluationTotalProp) {
    properties[proposalEvaluationTotalProp.id] = allScores.sum ?? '';
  }

  if (proposalEvaluationAverageProp) {
    properties[proposalEvaluationAverageProp.id] = allScores.average ?? '';
  }

  return properties;
}
