import type { RewardWorkflow } from './getRewardWorkflows';
import type { UpdateableRewardFields } from './updateRewardSettings';

export function inferRewardWorkflow(workflows: RewardWorkflow[], reward: UpdateableRewardFields | undefined) {
  if (!reward) {
    return null;
  }

  const applicationRequiredWorkflow = workflows.find((workflow) => workflow.id === 'application_required');
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission');
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned');
  const assignedKycWorkflow = workflows.find((workflow) => workflow.id === 'assigned_kyc');

  if (reward.assignedSubmitters === null || reward.assignedSubmitters?.length === 0) {
    return reward.approveSubmitters ? applicationRequiredWorkflow : directSubmissionWorkflow;
  }
  // @TODO how can I make this separate from
  if (assignedKycWorkflow) {
    return assignedKycWorkflow;
  }

  return assignedWorkflow;
}
