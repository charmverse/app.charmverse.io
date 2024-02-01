import type { AnswerData } from 'lib/proposal/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

import type { IPropertyTemplate } from './board';
import type { CardPropertyValue } from './card';

export function generateResyncedProposalEvaluationForCard({
  properties,
  templates,
  rubricAnswers,
  rubricCriteria,
  step
}: {
  properties: Record<string, CardPropertyValue>;
  templates: IPropertyTemplate[];
  rubricCriteria: { id: string }[];
  rubricAnswers: AnswerData[];
  step: { id: string; title: string };
}): Record<string, CardPropertyValue> {
  const { allScores, reviewersResults } = aggregateResults({
    answers: rubricAnswers.filter((a) => a.evaluationId === step.id),
    criteria: rubricCriteria.filter((c) => c.id !== step.id)
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
