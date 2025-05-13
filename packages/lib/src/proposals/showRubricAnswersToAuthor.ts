import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';

export function showRubricAnswersToAuthor({
  isAuthor,
  proposalFailed,
  isCurrentEvaluationStep,
  evaluationType,
  showAuthorResultsOnRubricFail
}: {
  isAuthor: boolean;
  proposalFailed: boolean;
  isCurrentEvaluationStep: boolean;
  evaluationType: ProposalEvaluationType;
  showAuthorResultsOnRubricFail: boolean;
}) {
  return (
    isAuthor &&
    proposalFailed &&
    isCurrentEvaluationStep &&
    evaluationType === 'rubric' &&
    showAuthorResultsOnRubricFail
  );
}
