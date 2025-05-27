import { arrayUtils } from '@charmverse/core/utilities';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from '@packages/lib/proposals/rubric/interfaces';
import { isNumber, roundNumber } from '@packages/lib/utils/numbers';
import { mean, sum } from 'lodash-es';

/**
 * null if no answers available
 */
export type NumericResults = { sum: number | null; average: number | null };

export type CriteriaResults = NumericResults & { comments: string[] };

export type ReviewerResults = NumericResults & {
  id: string;
  answersMap: Record<string, { score: number | undefined; comment: string | null }>;
};

/**
 * A map of results by userId
 */
export type AggregateResults = {
  reviewersResults: Record<string, ReviewerResults>;
  criteriaSummary: Record<string, CriteriaResults>;
  allScores: NumericResults;
};

export type AnswerData = Pick<
  ProposalRubricCriteriaAnswerWithTypedResponse,
  'comment' | 'userId' | 'response' | 'rubricCriteriaId'
> & { evaluationId?: string | null };

export function aggregateResults({
  criteria,
  answers
}: {
  answers: AnswerData[];
  criteria: { id: string }[];
}): AggregateResults {
  const criteriaScores: Record<string, number[]> = criteria.reduce(
    (criteriaRecord, _criteria) => {
      criteriaRecord[_criteria.id] = [];
      return criteriaRecord;
    },
    {} as Record<string, number[]>
  );

  const criteriaComments: Record<string, string[]> = criteria.reduce(
    (criteriaRecord, _criteria) => {
      criteriaRecord[_criteria.id] = [];
      return criteriaRecord;
    },
    {} as Record<string, string[]>
  );

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
        if (comment) {
          criteriaComments[criteriaId].push(comment);
        }
        userScores.push(score);
        answersMap[criteriaId] = { score, comment };
      }
    });

    const average = userScores.length > 0 ? mean(userScores) : null;
    const scoreSum = userScores.length > 0 ? sum(userScores) : null;

    reviewersResults.push({ id: reviewer, answersMap, average, sum: scoreSum });
  });
  const criteriaSummary = Object.entries(criteriaScores).reduce(
    (acc, [criteriaId, scores]) => {
      acc[criteriaId] = scores.length
        ? { average: mean(scores), sum: sum(scores), comments: criteriaComments[criteriaId] }
        : { average: null, sum: null, comments: [] };
      return acc;
    },
    {} as Record<string, CriteriaResults>
  );

  const allScores = Object.values(criteriaScores).flat();
  const allScoresSum = allScores.length ? sum(allScores) : null;
  const allScoresAverage = allScores.length ? roundNumber(mean(allScores)) : null;

  const mappedReviewerResults = reviewersResults.reduce(
    (acc, reviewer) => {
      acc[reviewer.id] = reviewer;
      return acc;
    },
    {} as Record<string, ReviewerResults>
  );

  return {
    reviewersResults: mappedReviewerResults,
    criteriaSummary,
    allScores: { sum: allScoresSum, average: allScoresAverage !== null ? Number(allScoresAverage) : null }
  };
}
