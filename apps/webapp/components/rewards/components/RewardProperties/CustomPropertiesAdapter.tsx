import { useMemo } from 'react';

import CardDetailProperties from 'components/common/DatabaseEditor/components/cardDetail/cardDetailProperties';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewardsBoardAndBlocks } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';
import type { PropertyType } from '@packages/databases/board';
import { REWARD_PROPOSAL_LINK } from '@packages/lib/rewards/blocks/constants';
import type { RewardPropertiesField } from '@packages/lib/rewards/blocks/interfaces';

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
  const { getFeatureTitle } = useSpaceFeatures();

  const mutator = usePropertiesMutator({ onChange });

  // card from current reward
  const rewardPage = getRewardPage(reward?.id);
  const card =
    space &&
    mapRewardToCard({
      reward,
      rewardPage,
      spaceId: space.id,
      spaceDomain: space.domain,
      members: membersRecord
    });

  const boardCustomProperties = useMemo(() => {
    if (board) {
      // extract non-custom properties
      const cardProperties = board.fields.cardProperties.filter((p) => !p.id.startsWith('__'));
      // Add proposal link as a custom property
      if (reward.sourceProposalPage) {
        cardProperties.push({
          readOnly: true,
          options: [],
          id: REWARD_PROPOSAL_LINK,
          name: getFeatureTitle('Proposal'),
          type: 'proposalUrl' as PropertyType
        });
      }
      return {
        ...board,
        fields: {
          ...board.fields,
          cardProperties
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
      isTemplate={rewardPage?.type === 'bounty_template'}
    />
  );
}
