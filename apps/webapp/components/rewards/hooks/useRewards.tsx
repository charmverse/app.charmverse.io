import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSWRConfig, type KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetRewards } from 'charmClient/hooks/rewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import type { RewardUpdate } from '@packages/lib/rewards/updateRewardSettings';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

type RewardsContextType = {
  rewards: RewardWithUsers[] | undefined;
  mutateRewards: KeyedMutator<RewardWithUsers[]>;
  isLoading: boolean;
  updateReward: (input: RewardUpdate) => Promise<void>;
  refreshReward: (rewardId: string) => Promise<RewardWithUsers>;
  creatingInlineReward: boolean;
  setCreatingInlineReward: (isCreating: boolean) => void;
  getRewardById: (id: string) => RewardWithUsers | undefined;
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
  setCreatingInlineReward: () => {},
  getRewardById: () => undefined
});

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { pages, loadingPages } = usePages();
  const { space } = useCurrentSpace();
  const { mutate } = useSWRConfig();

  const { data, mutate: mutateRewards, isLoading } = useGetRewards({ spaceId: space?.id });
  const [creatingInlineReward, setCreatingInlineReward] = useState<boolean>(false);
  const { subscribe } = useWebSocketClient();

  // filter out deleted and templates
  const rewards = useMemo(() => (data ? data.filter((reward) => !pages[reward.id]?.deletedAt) : []), [pages, data]);

  const updateReward = useCallback(
    async (rewardUpdate: RewardUpdate) => {
      if (rewardUpdate) {
        const updated = await charmClient.rewards.updateReward(rewardUpdate);

        mutateRewards(
          (rData) => {
            return rData?.map((reward) => {
              if (reward.id === updated.id) {
                return updated;
              }
              return reward;
            });
          },
          { revalidate: false }
        );
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

      // update cache for single reward get
      mutate(`/api/rewards/${rewardId}`, reward, false);

      return reward;
    },
    [mutate, mutateRewards]
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

  const getRewardById = useCallback(
    (id: string) => {
      return rewards?.find((reward) => reward.id === id);
    },
    [rewards]
  );

  const value = useMemo(
    () => ({
      rewards,
      mutateRewards,
      isLoading: isLoading || loadingPages,
      updateReward,
      refreshReward,
      setRewards: mutateRewards,
      setCreatingInlineReward,
      creatingInlineReward,
      getRewardById
    }),
    [
      rewards,
      mutateRewards,
      isLoading,
      loadingPages,
      updateReward,
      refreshReward,
      creatingInlineReward,
      setCreatingInlineReward,
      getRewardById
    ]
  );

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export const useRewards = () => useContext(RewardsContext);
