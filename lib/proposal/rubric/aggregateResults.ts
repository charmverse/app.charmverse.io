import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { mean, sum } from 'lodash';

import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';

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
  reviewerResults: Record<string, ReviewerResults>;
};

export function aggregateResults({
  reviewers,
  criteria,
  answers
}: {
  reviewers: Reviewer[];
  answers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  criteria: ProposalRubricCriteria[];
}) {
  const criteriaScores: Record<string, number[]> = {};
  criteria.forEach((c) => {
    criteriaScores[c.id] = [];
  });

  const reviewersResults: ReviewerResults[] = [];

  reviewers.forEach((reviewer) => {
    const rAnswers = answers.filter((answer) => answer.userId === reviewer.id);
    const answersMap: ReviewerResults['answersMap'] = {};
    const userScores: number[] = [];

    rAnswers.forEach((answer) => {
      if (typeof answer.response.score === 'number') {
        const {
          rubricCriteriaId: criteriaId,
          comment,
          response: { score }
        } = answer;

        // add score to user avg array
        userScores.push(score);

        // add score to critera avg array
        if (criteriaId in criteriaScores) {
          criteriaScores[criteriaId].push(score);
        }

        answersMap[criteriaId] = { score, comment };
      }
    });

    const average = userScores.length > 0 ? mean(userScores) : null;
    const scoreSum = userScores.length > 0 ? sum(userScores) : null;

    reviewersResults.push({ id: reviewer.id, answersMap, average, sum: scoreSum });
  });
  const criteriaSummary = Object.entries(criteriaScores).reduce((acc, [cId, scores]) => {
    acc[cId] = scores.length ? { average: mean(scores), sum: sum(scores) } : { average: null, sum: null };
    return acc;
  }, {} as Record<string, { sum: number | null; average: number | null }>);

  const allScores = Object.values(criteriaScores).flat();
  const allScoresSum = sum(allScores);
  const allScoresAverage = mean(allScores);

  return { reviewersResults, criteriaSummary, allScores: { sum: allScoresSum, average: allScoresAverage } };
}
