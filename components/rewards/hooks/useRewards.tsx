import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetRewards } from 'charmClient/hooks/rewards';
import type { RewardStatusFilter } from 'components/rewards/components/RewardViewOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { RewardUpdate } from 'lib/rewards/updateRewardSettings';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

type RewardsContextType = {
  rewards: RewardWithUsers[] | undefined;
  mutateRewards: KeyedMutator<RewardWithUsers[]>;
  isLoading: boolean;
  updateReward: (input: RewardUpdate) => Promise<void>;
  refreshReward: (rewardId: string) => Promise<RewardWithUsers>;
  creatingInlineReward: boolean;
  setCreatingInlineReward: (isCreating: boolean) => void;
};

export const RewardsContext = createContext<Readonly<RewardsContextType>>({
  rewards: undefined,
  mutateRewards: async () => {
    return undefined;
  },
  isLoading: false,
  updateReward: () => Promise.resolve(),
  refreshReward: () => Promise.resolve() as any,
  creatingInlineReward: false,
  setCreatingInlineReward: () => {}
});

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { pages, loadingPages } = usePages();
  const { space } = useCurrentSpace();
  const { user } = useUser();

  const { data, mutate: mutateRewards, isLoading } = useGetRewards({ spaceId: space?.id });
  const [creatingInlineReward, setCreatingInlineReward] = useState<boolean>(false);
  const { subscribe } = useWebSocketClient();

  // filter out deleted and templates
  const rewards = useMemo(
    () => (data ? data.filter((reward) => !pages[reward.id]?.deletedAt && pages[reward.id]?.type === 'bounty') : []),
    [pages, data]
  );

  const updateReward = useCallback(
    async (rewardUpdate: RewardUpdate) => {
      if (rewardUpdate) {
        await charmClient.rewards.updateReward(rewardUpdate);

        mutateRewards();
      }
    },
    [mutateRewards]
  );

  const refreshReward = useCallback(
    async (rewardId: string) => {
      const reward = await charmClient.rewards.getReward(rewardId);
      mutateRewards(
        (rData) => {
          const rewardList = rData ? [...rData] : [];
          const rewardIndex = rewardList.findIndex((p) => p.id === rewardId);

          if (rewardIndex >= 0) {
            const existingReward = rewardList[rewardIndex];
            rewardList[rewardIndex] = {
              ...existingReward,
              ...reward
            };
          } else {
            rewardList.push(reward);
          }
          return rewardList;
        },
        { revalidate: false }
      );
      return reward;
    },
    [mutateRewards]
  );

  useEffect(() => {
    function handleDeleteEvent(deletedPages: WebSocketPayload<'pages_deleted'>) {
      mutateRewards(
        (_rewards) => {
          return _rewards?.filter((reward) => !deletedPages.some((page) => page.id === reward.id));
        },
        {
          revalidate: false
        }
      );
    }

    function handleCreateEvent(createdPages: WebSocketPayload<'pages_created'>) {
      if (createdPages.some((page) => page.type === 'bounty')) {
        mutateRewards();
      }
    }

    const unsubscribeFromPageDeletes = subscribe('pages_deleted', handleDeleteEvent);
    const unsubscribeFromPageCreated = subscribe('pages_created', handleCreateEvent);

    return () => {
      unsubscribeFromPageDeletes();
      unsubscribeFromPageCreated();
    };
  }, [mutateRewards, subscribe]);

  const value = useMemo(
    () => ({
      rewards,
      mutateRewards,
      isLoading: isLoading || loadingPages,
      updateReward,
      refreshReward,
      setRewards: mutateRewards,
      setCreatingInlineReward,
      creatingInlineReward
    }),
    [
      rewards,
      mutateRewards,
      isLoading,
      loadingPages,
      updateReward,
      refreshReward,
      creatingInlineReward,
      setCreatingInlineReward
    ]
  );

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export const useRewards = () => useContext(RewardsContext);
