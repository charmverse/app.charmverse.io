import type { RewardEvaluation, RewardWorkflow } from '@packages/lib/rewards/getRewardWorkflows';

export function getCurrentRewardEvaluation(workflow: RewardWorkflow): RewardEvaluation {
  const currentEvaluation = workflow.evaluations.find(
    (evaluation) => evaluation.result === 'fail' || !evaluation.result
  );
  return currentEvaluation ?? workflow.evaluations[workflow.evaluations.length - 1];
}
