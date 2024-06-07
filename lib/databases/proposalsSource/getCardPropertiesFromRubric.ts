import type { ProposalPropertyValue } from 'lib/proposals/blocks/interfaces';
import type { AnswerData } from 'lib/proposals/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposals/rubric/aggregateResults';

import type { IPropertyTemplate } from '../board';

export function getCardPropertiesFromRubric({
  properties,
  templates,
  rubricAnswers,
  rubricCriteria,
  step
}: {
  properties: Record<string, ProposalPropertyValue>;
  templates: IPropertyTemplate[];
  rubricCriteria: { id: string; title: string }[];
  rubricAnswers: AnswerData[];
  step: { id: string; title: string };
}): Record<string, ProposalPropertyValue> {
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
    if (template.type === 'proposalRubricCriteriaTotal' && template.criteriaTitle) {
      properties[template.id] =
        ((properties[template.id] as number) ?? 0) + (rubricStepScore[template.criteriaTitle] ?? 0);
    }
  });

  const uniqueReviewers = Object.keys(reviewersResults);

  const proposalEvaluatedByProp = templates.find(
    (p) => p.type === 'proposalEvaluatedBy' && p.evaluationTitle === step.title
  );
  const proposalEvaluationTotalProp = templates.find(
    (p) => p.type === 'proposalEvaluationTotal' && p.evaluationTitle === step.title
  );
  const proposalEvaluationAverageProp = templates.find(
    (p) => p.type === 'proposalEvaluationAverage' && p.evaluationTitle === step.title
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
