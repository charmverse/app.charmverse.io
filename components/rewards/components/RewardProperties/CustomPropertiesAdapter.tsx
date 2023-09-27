import { useEffect } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { usePropertiesMutator } from 'components/rewards/components/RewardProperties/hooks/useRewardsMutator';
import { useUser } from 'hooks/useUser';
import type { Card } from 'lib/focalboard/card';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';
import type { RewardCard, RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';

import { useRewardsBoardAdapter } from './hooks/useRewardsBoardAdapter';

type Props = {
  reward: { spaceId?: string; id?: string } & RewardFieldsProp;
  onChange?: (properties: RewardPropertiesField) => void;
  readOnly?: boolean;
};

export function CustomPropertiesAdapter({ reward, onChange, readOnly }: Props) {
  const { user } = useUser();
  // TODO - use value from context instead of raw hook
  const { boardCustomProperties, card, cards, activeView, views, rewardPage, setBoardReward } =
    useRewardsBoardAdapter();
  const mutator = usePropertiesMutator({ reward, onChange });

  useEffect(() => {
    setBoardReward(reward);
  }, [reward]);

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
    />
  );
}
