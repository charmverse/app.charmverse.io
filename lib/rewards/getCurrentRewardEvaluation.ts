import type { RewardEvaluation, RewardWorkflow } from 'pages/api/spaces/[id]/rewards/workflows';

export function getCurrentRewardEvaluation(workflow: RewardWorkflow): RewardEvaluation {
  const currentEvaluation = workflow.evaluations.find(
    (evaluation) => evaluation.result === 'fail' || !evaluation.result
  );
  return currentEvaluation ?? workflow.evaluations[workflow.evaluations.length - 1];
}
