import type { ProposalRubricCriteria } from '@charmverse/core/prisma-client';
import { mean, sum } from 'lodash';

import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';

type Reviewer = { id: string };

export type ReviewerResults = {
  id: string;
  answersMap: Record<string, { score: number | undefined; comment: string | null }>;
  average: number | undefined;
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

    const average = mean(userScores);

    reviewersResults.push({ id: reviewer.id, answersMap, average });
  });

  const criteriaSummary = Object.entries(criteriaScores).reduce((acc, [cId, scores]) => {
    acc[cId] = scores.length ? { average: mean(scores), sum: sum(scores) } : { average: null, sum: null };
    return acc;
  }, {} as Record<string, { sum: number | null; average: number | null }>);

  return { reviewersResults, criteriaSummary };
}
