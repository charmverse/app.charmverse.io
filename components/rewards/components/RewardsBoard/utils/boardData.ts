import type { Block } from '@charmverse/core/prisma';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultRewardProperties } from 'components/rewards/components/RewardsBoard/utils/getDefaultRewardProperties';
import type { Block as FBBlock } from 'lib/databases/block';
import { createBoard } from 'lib/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

export function getDefaultBoard({
  storedBoard,
  hasMilestoneRewards = false
}: {
  storedBoard: (Omit<Block, 'fields'> & { fields: any }) | undefined;
  hasMilestoneRewards?: boolean;
}) {
  const block: Partial<FBBlock> = storedBoard
    ? blockToFBBlock(storedBoard)
    : createBoard({
        block: {
          id: DEFAULT_BOARD_BLOCK_ID,
          fields: {
            cardProperties: [],
            viewIds: defaultRewardViews
          }
        }
      });

  const cardProperties = [...getDefaultRewardProperties(hasMilestoneRewards), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}
