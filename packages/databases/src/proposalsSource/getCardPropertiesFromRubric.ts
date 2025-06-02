import type { ProposalPropertyValue } from '@packages/lib/proposals/blocks/interfaces';
import type { AnswerData } from '@packages/lib/proposals/rubric/aggregateResults';
import { aggregateResults } from '@packages/lib/proposals/rubric/aggregateResults';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';

import type { IPropertyTemplate } from '../board';

import type { ProposalData } from './getCardProperties';

export function getCardPropertiesFromRubric({
  properties,
  cardProperties,
  evaluations,
  templateId
}: {
  templateId: string | null;
  evaluations: ProposalData['proposal']['evaluations'];
  properties: Record<string, ProposalPropertyValue>;
  cardProperties: IPropertyTemplate[];
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
      cardProperties.forEach((p) => {
        if (
          p.criteriaTitle === criteria.title &&
          p.reviewerId === rubricCriteriaAnswer.userId &&
          p.templateId === templateId
        ) {
          if (p.type === 'proposalRubricCriteriaReviewerComment') {
            properties[p.id] = rubricCriteriaAnswer.comment ?? '';
          } else if (p.type === 'proposalRubricCriteriaReviewerScore') {
            properties[p.id] = rubricCriteriaAnswer.response.score ?? '';
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

  cardProperties.forEach((p) => {
    if (p.criteriaTitle && rubricCriteriaScore[p.criteriaTitle] && p.templateId === templateId) {
      if (p.type === 'proposalRubricCriteriaTotal') {
        properties[p.id] = ((properties[p.id] as number) ?? 0) + rubricCriteriaScore[p.criteriaTitle].total;
      } else if (p.type === 'proposalRubricCriteriaAverage') {
        properties[p.id] =
          ((properties[p.id] as number) ?? 0) +
          Number((rubricCriteriaScore[p.criteriaTitle].total / rubricCriteriaScore[p.criteriaTitle].count).toFixed(2));
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

    const proposalEvaluatedByProp = cardProperties.find(
      (p) => p.type === 'proposalEvaluatedBy' && p.evaluationTitle === evaluation.title && p.templateId === templateId
    );
    const proposalEvaluationTotalProp = cardProperties.find(
      (p) =>
        p.type === 'proposalEvaluationTotal' && p.evaluationTitle === evaluation.title && p.templateId === templateId
    );
    const proposalEvaluationAverageProp = cardProperties.find(
      (p) =>
        p.type === 'proposalEvaluationAverage' && p.evaluationTitle === evaluation.title && p.templateId === templateId
    );

    const proposalEvaluationReviewerAverageProp = cardProperties.find(
      (p) =>
        p.type === 'proposalEvaluationReviewerAverage' &&
        p.evaluationTitle === evaluation.title &&
        p.templateId === templateId
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

    if (proposalEvaluationReviewerAverageProp) {
      const totalReviewers = Object.keys(reviewersResults).length;
      properties[proposalEvaluationReviewerAverageProp.id] =
        totalReviewers === 0 ? 0 : (allScores.sum || 0) / totalReviewers || 0;
    }
  }

  return properties;
}
