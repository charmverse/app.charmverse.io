import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { mean, sum } from 'lodash';

import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import { isNumber } from 'lib/utilities/numbers';

/**
 * null if no answers available
 */
export type NumericResults = { sum: number | null; average: number | null };

export type ReviewerResults = NumericResults & {
  id: string;
  answersMap: Record<string, { score: number | undefined; comment: string | null }>;
};

/**
 * A map of results by userId
 */
export type AggregateResults = {
  reviewersResults: Record<string, ReviewerResults>;
  criteriaSummary: Record<string, NumericResults>;
  allScores: NumericResults;
};

export function aggregateResults({
  criteria,
  answers
}: {
  answers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteria: ProposalRubricCriteria[];
}): AggregateResults {
  const criteriaScores: Record<string, number[]> = criteria.reduce((criteriaRecord, _criteria) => {
    criteriaRecord[_criteria.id] = [];
    return criteriaRecord;
  }, {} as Record<string, number[]>);

  const reviewersResults: ReviewerResults[] = [];

  const reviewers = arrayUtils.uniqueValues(answers.map((answer) => answer.userId));

  reviewers.forEach((reviewer) => {
    const rAnswers = answers.filter((answer) => answer.userId === reviewer);
    const answersMap: ReviewerResults['answersMap'] = {};
    const userScores: number[] = [];

    rAnswers.forEach((answer) => {
      if (isNumber(answer.response.score) && criteriaScores[answer.rubricCriteriaId]) {
        const {
          rubricCriteriaId: criteriaId,
          comment,
          response: { score }
        } = answer;

        criteriaScores[criteriaId].push(score);
        userScores.push(score);
        answersMap[criteriaId] = { score, comment };
      }
    });

    const average = userScores.length > 0 ? mean(userScores) : null;
    const scoreSum = userScores.length > 0 ? sum(userScores) : null;

    reviewersResults.push({ id: reviewer, answersMap, average, sum: scoreSum });
  });
  const criteriaSummary = Object.entries(criteriaScores).reduce((acc, [criteriaId, scores]) => {
    acc[criteriaId] = scores.length ? { average: mean(scores), sum: sum(scores) } : { average: null, sum: null };
    return acc;
  }, {} as Record<string, NumericResults>);

  const allScores = Object.values(criteriaScores).flat();
  const allScoresSum = allScores.length ? sum(allScores) : null;
  const allScoresAverage = allScores.length ? mean(allScores) : null;

  const mappedReviewerResults = reviewersResults.reduce((acc, reviewer) => {
    acc[reviewer.id] = reviewer;
    return acc;
  }, {} as Record<string, ReviewerResults>);

  return {
    reviewersResults: mappedReviewerResults,
    criteriaSummary,
    allScores: { sum: allScoresSum, average: allScoresAverage }
  };
}
