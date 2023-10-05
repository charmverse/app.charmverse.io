import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

export function NewRewardButton() {
  const { user } = useUser();
  const router = useRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { createReward } = useRewards();
  const { refreshPage } = usePages();

  async function onClickCreate() {
    if (currentSpace && user) {
      const createdReward = await createReward({
        chainId: 1,
        status: 'open',
        spaceId: currentSpace.id,
        createdBy: user.id,
        rewardAmount: 1,
        rewardToken: 'ETH'
      });

      if (createdReward) {
        refreshPage(createdReward.id);
        router.push({ pathname: router.pathname, query: { ...router.query, id: createdReward.id } });
      }
    }
  }

  return (
    <Button data-test='create-suggest-bounty' onClick={onClickCreate}>
      Create
    </Button>
  );
}
