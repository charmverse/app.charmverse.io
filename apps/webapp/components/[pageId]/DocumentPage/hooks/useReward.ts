import type { Prisma } from '@charmverse/core/prisma-client';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetReward } from 'charmClient/hooks/rewards';
import type { RewardFields } from '@packages/lib/rewards/blocks/interfaces';
import type { RewardWorkflow } from '@packages/lib/rewards/getRewardWorkflows';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';

export function useReward({ rewardId }: { rewardId: MaybeString }) {
  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId });

  async function updateReward(updateContent: UpdateableRewardFields) {
    if (rewardId) {
      await charmClient.rewards.updateReward({
        rewardId,
        updateContent
      });
      refreshReward();
    }
  }

  async function onChangeRewardWorkflow(workflow: RewardWorkflow) {
    const updatedFields = {
      ...((reward?.fields as RewardFields) ?? {}),
      workflowId: workflow.id
    } as Prisma.JsonObject;

    if (workflow.id === 'application_required') {
      updateReward({
        approveSubmitters: true,
        assignedSubmitters: null,
        fields: updatedFields
      });
    } else if (workflow.id === 'direct_submission') {
      updateReward({
        approveSubmitters: false,
        assignedSubmitters: null,
        fields: updatedFields
      });
    } else if (workflow.id === 'assigned' || workflow.id === 'assigned_kyc') {
      updateReward({
        approveSubmitters: false,
        allowMultipleApplications: false,
        assignedSubmitters: [],
        fields: updatedFields
      });
    }
  }

  return {
    reward,
    refreshReward,
    updateReward,
    onChangeRewardWorkflow
  };
}
