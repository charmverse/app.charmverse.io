import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetReward } from 'charmClient/hooks/rewards';
import { useUser } from 'hooks/useUser';
import type { RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function useReward({ rewardId }: { rewardId: MaybeString }) {
  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId });
  const { user } = useUser();

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
    if (workflow.id === 'application_required') {
      updateReward({
        approveSubmitters: true,
        assignedSubmitters: null
      });
    } else if (workflow.id === 'direct_submission') {
      updateReward({
        approveSubmitters: false,
        assignedSubmitters: null
      });
    } else if (workflow.id === 'assigned') {
      updateReward({
        approveSubmitters: false,
        allowMultipleApplications: false,
        assignedSubmitters: [user!.id]
      });
    } else if (workflow.id === 'assigned_kyc') {
      updateReward({
        approveSubmitters: false,
        allowMultipleApplications: false,
        assignedSubmitters: [user!.id]
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
