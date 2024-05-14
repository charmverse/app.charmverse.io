import type { RewardFields } from './blocks/interfaces';
import type { RewardWorkflow } from './getRewardWorkflows';

export function inferRewardWorkflow(workflows: RewardWorkflow[], rewardFields: RewardFields) {
  const workflowId = rewardFields.workflowId;
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission');
  return workflows.find((workflow) => workflow.id === workflowId) ?? directSubmissionWorkflow;
}
