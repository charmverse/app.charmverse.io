import type { RewardWorkflow } from './getRewardWorkflows';
import type { UpdateableRewardFields } from './updateRewardSettings';

export function inferRewardWorkflow(
  workflows: RewardWorkflow[],
  reward: Pick<UpdateableRewardFields, 'assignedSubmitters' | 'approveSubmitters' | 'fields'>
) {
  const applicationRequiredWorkflow = workflows.find((workflow) => workflow.id === 'application_required');
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission');
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned');
  const assignedKycWorkflow = workflows.find((workflow) => workflow.id === 'assigned_kyc');

  if (reward.assignedSubmitters === null || reward.assignedSubmitters?.length === 0) {
    return reward.approveSubmitters ? applicationRequiredWorkflow : directSubmissionWorkflow;
  }

  if (assignedKycWorkflow && (reward.fields as { hasKyc?: boolean } | undefined | null)?.hasKyc) {
    return assignedKycWorkflow;
  }

  return assignedWorkflow;
}
