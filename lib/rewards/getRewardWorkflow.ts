import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { RewardWorkflow } from 'pages/api/spaces/[id]/rewards/workflows';

export function getRewardWorkflow(
  workflows: RewardWorkflow[],
  reward: Partial<Pick<RewardWithUsers, 'assignedSubmitters' | 'approveSubmitters'>> | undefined
) {
  if (!reward) {
    return null;
  }

  const applicationRequiredWorkflow = workflows.find((workflow) => workflow.id === 'application_required');
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission');
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned');

  if (reward.assignedSubmitters === null) {
    return reward.approveSubmitters ? applicationRequiredWorkflow : directSubmissionWorkflow;
  }

  return assignedWorkflow;
}
