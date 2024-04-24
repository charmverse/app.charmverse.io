import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import type { UIBlockWithDetails as FBBlock, BlockWithDetails } from 'lib/databases/block';
import { createBoard } from 'lib/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

import { getDefaultRewardProperties } from './getDefaultRewardProperties';

export function getDefaultBoard({
  storedBoard
}: {
  storedBoard: (Omit<BlockWithDetails, 'fields'> & { fields: any }) | undefined;
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

  const cardProperties = [...getDefaultRewardProperties(), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}
