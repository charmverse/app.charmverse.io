import type { Application } from '@charmverse/core/prisma-client';
import { useMemo } from 'react';

import { Button } from 'components/common/Button';
import { MultiRewardPaymentButton } from 'components/rewards/components/RewardApplicationPage/components/MultiRewardPaymentButton';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePages } from 'hooks/usePages';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { ApplicationMeta, RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utilities/types';

type ApplicationLite = Pick<Application, 'id' | 'walletAddress' | 'bountyId' | 'createdBy'>;

export function BatchPaymentRewards({ checkedIds }: { checkedIds: string[] }) {
  const { pages } = usePages();
  const { rewards, mutateRewards } = useRewards();
  const selectedRewards = useMemo(() => {
    const rewardsRecord =
      rewards?.filter(isTruthy)?.reduce<
        Record<
          string,
          RewardWithUsers & {
            submissions: ApplicationLite[];
          }
        >
      >((acc, reward) => {
        const completedApplications = reward.applications.filter((application) => application.status === 'complete');
        acc[reward.id] = {
          ...reward,
          submissions: completedApplications.map((application) => ({
            ...application,
            bountyId: reward.id
          }))
        };
        return acc;
      }, {}) ?? {};

    const _selectedRewards = (checkedIds
      ?.map((pageId) => {
        const page = pages[pageId];
        if (page && page.type === 'bounty' && page.bountyId) {
          return rewardsRecord[page.bountyId];
        }
        return null;
      })
      .filter((reward) => isTruthy(reward) && getRewardType(reward) === 'token') ?? []) as (RewardWithUsers & {
      submissions: ApplicationLite[];
    })[];

    return _selectedRewards;
  }, [pages, rewards, checkedIds]);

  const firstReward = selectedRewards[0];
  const disabledTooltip =
    checkedIds.length === 0
      ? 'No rewards selected'
      : !firstReward
      ? `Selected rewards either doesn't have completed submissions or are not token rewards`
      : undefined;

  return firstReward ? (
    <MultiRewardPaymentButton
      chainIdToUse={firstReward.chainId as number}
      rewards={selectedRewards}
      tokenSymbolOrAddress={firstReward.rewardToken as string}
      refreshSubmissions={mutateRewards}
      buttonVariant='outlined'
    />
  ) : (
    <Button color='secondary' size='small' variant='outlined' disabled disabledTooltip={disabledTooltip}>
      Send Payment
    </Button>
  );
}
