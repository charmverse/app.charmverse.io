import type { ProposalPropertyValue } from 'lib/proposals/blocks/interfaces';
import type { AnswerData } from 'lib/proposals/rubric/aggregateResults';
import { aggregateResults } from 'lib/proposals/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposals/rubric/interfaces';

import type { IPropertyTemplate } from '../board';

import type { ProposalData } from './getCardProperties';

export function getCardPropertiesFromRubric({
  properties,
  templates,
  evaluations
}: {
  evaluations: ProposalData['proposal']['evaluations'];
  properties: Record<string, ProposalPropertyValue>;
  templates: IPropertyTemplate[];
}): Record<string, ProposalPropertyValue> {
  const rubricCriteriaScore: Record<
    string,
    {
      total: number;
      count: number;
    }
  > = {};

  const allRubricCriterias = evaluations.map((e) => e.rubricCriteria).flat();
  const allRubricAnswers = evaluations
    .map((e) => e.rubricAnswers)
    .flat() as ProposalRubricCriteriaAnswerWithTypedResponse[];

  allRubricCriterias.forEach((criteria) => {
    const filteredRubricAnswers = allRubricAnswers.filter((a) => a.rubricCriteriaId === criteria.id);
    filteredRubricAnswers.forEach((rubricCriteriaAnswer) => {
      templates.forEach((template) => {
        if (template.criteriaTitle === criteria.title && template.reviewerId === rubricCriteriaAnswer.userId) {
          if (template.type === 'proposalRubricCriteriaReviewerComment') {
            properties[template.id] = rubricCriteriaAnswer.comment ?? '';
          } else if (template.type === 'proposalRubricCriteriaReviewerScore') {
            properties[template.id] = rubricCriteriaAnswer.response.score ?? '';
          }
        }
      });
    });
    const totalScore = filteredRubricAnswers.reduce((acc, answer) => {
      return answer.response.score ? acc + answer.response.score : acc;
    }, 0);

    if (rubricCriteriaScore[criteria.title]) {
      rubricCriteriaScore[criteria.title].total += totalScore;
      rubricCriteriaScore[criteria.title].count += filteredRubricAnswers.length;
    } else {
      rubricCriteriaScore[criteria.title] = {
        total: totalScore,
        count: filteredRubricAnswers.length
      };
    }
  });

  templates.forEach((template) => {
    if (template.criteriaTitle && rubricCriteriaScore[template.criteriaTitle]) {
      if (template.type === 'proposalRubricCriteriaTotal') {
        properties[template.id] =
          ((properties[template.id] as number) ?? 0) + rubricCriteriaScore[template.criteriaTitle].total;
      } else if (template.type === 'proposalRubricCriteriaAverage') {
        properties[template.id] =
          ((properties[template.id] as number) ?? 0) +
          Number(
            (
              rubricCriteriaScore[template.criteriaTitle].total / rubricCriteriaScore[template.criteriaTitle].count
            ).toFixed(2)
          );
      }
    }
  });

  for (const evaluation of evaluations) {
    const { rubricAnswers, rubricCriteria } = evaluation;
    const { allScores, reviewersResults } = aggregateResults({
      answers: rubricAnswers.filter((a) => a.evaluationId === evaluation.id) as unknown as AnswerData[],
      criteria: rubricCriteria.filter((c) => c.id !== evaluation.id)
    });

    const uniqueReviewers = Object.keys(reviewersResults);

    const proposalEvaluatedByProp = templates.find(
      (p) => p.type === 'proposalEvaluatedBy' && p.evaluationTitle === evaluation.title
    );
    const proposalEvaluationTotalProp = templates.find(
      (p) => p.type === 'proposalEvaluationTotal' && p.evaluationTitle === evaluation.title
    );
    const proposalEvaluationAverageProp = templates.find(
      (p) => p.type === 'proposalEvaluationAverage' && p.evaluationTitle === evaluation.title
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
  }

  return properties;
}
