import charmClient from 'charmClient';
import type { WorkInput } from 'components/rewards/hooks/useApplication';
import { useRewards } from 'components/rewards/hooks/useRewards';

export function useNewWork(rewardId?: string) {
  const { refreshReward } = useRewards();

  const createNewWork = async (input: WorkInput) => {
    if (rewardId) {
      const application = await charmClient.rewards.work({ ...input, rewardId });
      refreshReward(rewardId);

      return application;
    }
  };

  return { createNewWork };
}
