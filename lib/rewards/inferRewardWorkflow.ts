import type { RewardType, RewardWithUsers } from 'lib/rewards/interfaces';

import type { RewardWorkflow } from './getRewardWorkflows';

export type RewardInput = Partial<
  Pick<
    RewardWithUsers,
    | 'assignedSubmitters'
    | 'approveSubmitters'
    | 'reviewers'
    | 'dueDate'
    | 'allowMultipleApplications'
    | 'allowedSubmitterRoles'
    | 'maxSubmissions'
    | 'chainId'
    | 'customReward'
    | 'rewardToken'
    | 'rewardAmount'
  > & { rewardType?: RewardType }
>;

export function inferRewardWorkflow(workflows: RewardWorkflow[], reward: RewardInput | undefined) {
  if (!reward) {
    return null;
  }

  const applicationRequiredWorkflow = workflows.find((workflow) => workflow.id === 'application_required');
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission');
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned');

  if (reward.assignedSubmitters === null || reward.assignedSubmitters?.length === 0) {
    return reward.approveSubmitters ? applicationRequiredWorkflow : directSubmissionWorkflow;
  }

  return assignedWorkflow;
}
