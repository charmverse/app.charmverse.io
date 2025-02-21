import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { getRewardWorkflows, RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from '@packages/utils/types';

export function inferRewardWorkflowOld(
  workflows: RewardWorkflow[],
  reward: Pick<UpdateableRewardFields, 'assignedSubmitters' | 'approveSubmitters' | 'fields'>
) {
  const applicationRequiredWorkflow = workflows.find(
    (workflow) => workflow.id === 'application_required'
  ) as RewardWorkflow;
  const directSubmissionWorkflow = workflows.find((workflow) => workflow.id === 'direct_submission') as RewardWorkflow;
  const assignedWorkflow = workflows.find((workflow) => workflow.id === 'assigned') as RewardWorkflow;
  const assignedKycWorkflow = workflows.find((workflow) => workflow.id === 'assigned_kyc') as RewardWorkflow;

  const rewardFields = reward.fields as { isAssigned?: boolean; hasKyc?: boolean } | undefined | null;

  if (rewardFields?.hasKyc) {
    return assignedKycWorkflow;
  }

  if (reward.assignedSubmitters === null || reward.assignedSubmitters?.length === 0) {
    return reward.approveSubmitters ? applicationRequiredWorkflow : directSubmissionWorkflow;
  }

  return assignedWorkflow;
}

async function addRewardFieldsWorkflowId() {
  const bounties = await prisma.bounty.findMany({
    select: {
      id: true,
      fields: true,
      approveSubmitters: true,
      permissions: {
        select: {
          permissionLevel: true,
          userId: true
        }
      }
    }
  });

  const totalBounties = bounties.length;
  let currentBounty = 0;

  const workflows = getRewardWorkflows();

  for (const bounty of bounties) {
    try {
      const assignedSubmitters = bounty.permissions
        .filter((permission) => permission.permissionLevel === 'submitter')
        .map((permission) => permission.userId)
        .filter(isTruthy);
      const workflow = inferRewardWorkflowOld(workflows, {
        approveSubmitters: bounty.approveSubmitters,
        assignedSubmitters,
        fields: bounty.fields
      });

      await prisma.bounty.update({
        where: {
          id: bounty.id
        },
        data: {
          fields: {
            ...(bounty.fields as Prisma.JsonObject),
            workflowId: workflow.id
          }
        }
      });
    } catch (err) {
      console.error(`Error adding workflowId to bounty ${bounty.id}`, err);
    } finally {
      currentBounty++;
      console.log(`Processed ${currentBounty} of ${totalBounties} bounties`);
    }
  }
}

addRewardFieldsWorkflowId().then(() => console.log('Done!'));
