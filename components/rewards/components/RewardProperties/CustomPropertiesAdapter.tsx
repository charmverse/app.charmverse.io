import { useEffect, useMemo, useState } from 'react';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewardsBoardAndBlocks } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { RewardFieldsProp, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';

import { mapRewardToCardPage } from '../../hooks/useRewardsBoardAdapter';

import { usePropertiesMutator } from './hooks/useRewardsMutator';

type BoardReward = { spaceId?: string; id?: string } & RewardFieldsProp;

type Props = {
  reward: { spaceId?: string; id?: string } & RewardFieldsProp;
  onChange?: (properties: RewardPropertiesField) => void;
  readOnly?: boolean;
};
export function CustomPropertiesAdapter({ reward, onChange, readOnly }: Props) {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { pages } = usePages();
  const { getRewardPage } = useRewardPage();
  const { membersRecord } = useMembers();
  const [boardReward, setBoardReward] = useState<BoardReward | null>(null);
  const { board, cards, activeView, views } = useRewardsBoardAndBlocks();
  const mutator = usePropertiesMutator({ reward, onChange });

  // card from current reward
  const rewardPage = getRewardPage(boardReward?.id);
  const card = mapRewardToCardPage({
    reward: boardReward,
    rewardPage,
    spaceId: space?.id,
    members: membersRecord,
    pages
  }).card;

  useEffect(() => {
    setBoardReward(reward);
    return () => setBoardReward(null);
  }, [reward, setBoardReward]);

  const boardCustomProperties = useMemo(() => {
    if (board) {
      return {
        ...board,
        fields: {
          ...board.fields,
          // extract non-custom properties
          cardProperties: board.fields.cardProperties.filter((p) => !p.id.startsWith('__'))
        }
      };
    }
    return board;
  }, [board]);

  if (!boardCustomProperties) {
    return null;
  }

  return (
    <CardDetailProperties
      board={boardCustomProperties}
      card={card}
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
