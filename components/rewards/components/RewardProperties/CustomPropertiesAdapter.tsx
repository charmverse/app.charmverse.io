import { useMemo } from 'react';

import CardDetailProperties from 'components/common/DatabaseEditor/components/cardDetail/cardDetailProperties';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewardsBoardAndBlocks } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { RewardPropertiesField } from 'lib/rewards/blocks/interfaces';

import { mapRewardToCard } from '../../hooks/useRewardsBoardAdapter';
import type { BoardReward } from '../../hooks/useRewardsBoardAdapter';

import { usePropertiesMutator } from './hooks/useRewardsMutator';

type Props = {
  reward: BoardReward;
  onChange?: (properties: RewardPropertiesField) => void;
  readOnly?: boolean;
};
export function CustomPropertiesAdapter({ reward, onChange, readOnly }: Props) {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { getRewardPage } = useRewardPage();
  const { membersRecord } = useMembers();
  const { board, cards, activeView, views } = useRewardsBoardAndBlocks();

  const mutator = usePropertiesMutator({ onChange });

  // card from current reward
  const rewardPage = getRewardPage(reward?.id);
  const card =
    space &&
    mapRewardToCard({
      reward,
      rewardPage,
      spaceId: space.id,
      members: membersRecord
    });

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

  if (!boardCustomProperties || !card) {
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
