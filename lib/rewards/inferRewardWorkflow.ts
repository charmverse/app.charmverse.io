import type { RewardFields } from './blocks/interfaces';
import type { RewardWorkflow } from './getRewardWorkflows';

export function inferRewardWorkflow(workflows: RewardWorkflow[], rewardFields: RewardFields) {
  const workflowId = rewardFields.workflowId;
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned');
  return workflows.find((workflow) => workflow.id === workflowId) ?? assignedWorkflow;
}
