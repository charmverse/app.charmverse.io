import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { RewardCard, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';

import type { BoardReward } from './hooks/useRewardsBoardAdapter';
import { usePropertiesMutator } from './hooks/useRewardsMutator';

type Props = {
  reward: BoardReward;
  onChange?: (properties: RewardPropertiesField) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ reward, onChange, readOnly }: Props) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { boardCustomProperties, card, cards, activeView, views, rewardPage, setBoardReward } = useRewardsBoard();
  const mutator = usePropertiesMutator({ onChange });

  useEffect(() => {
    setBoardReward(reward);
    return () => setBoardReward(null);
  }, [reward, setBoardReward]);

  return (
    <CardDetailProperties
      board={boardCustomProperties}
      card={card as RewardCard}
      cards={cards}
      activeView={activeView}
      views={views}
      readOnly={!!readOnly}
      pageUpdatedAt={rewardPage?.updatedAt.toString() || new Date().toString()}
      pageUpdatedBy={rewardPage?.updatedBy || user?.id || ''}
      mutator={mutator ?? undefined}
      disableEditPropertyOption={!isAdmin}
      boardType='rewards'
    />
  );
}
