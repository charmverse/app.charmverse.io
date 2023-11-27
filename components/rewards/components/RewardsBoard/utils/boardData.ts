import { RPCList } from 'connectors/chains';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultRewardProperties } from 'components/rewards/components/RewardsBoard/utils/getDefaultRewardProperties';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { DEFAULT_CALENDAR_VIEW_BLOCK_ID, DEFAULT_TABLE_VIEW_BLOCK_ID } from 'lib/focalboard/customBlocks/constants';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import type { RewardPropertiesBlock } from 'lib/rewards/blocks/interfaces';
import {
  generateDefaultBoardView,
  generateDefaultCalendarView,
  generateDefaultTableView
} from 'lib/rewards/blocks/views';

export const tokenChainOptions: IPropertyTemplate['options'] = RPCList.map((rpc) => ({
  id: rpc.chainId.toString(),
  value: rpc.chainName,
  color: ''
}));

export function getDefaultBoard({
  storedBoard,
  customOnly = false
}: {
  storedBoard: RewardPropertiesBlock | undefined;
  customOnly?: boolean;
}) {
  const block: Partial<Block> = storedBoard
    ? blockToFBBlock(storedBoard)
    : createBoard({
        block: {
          id: DEFAULT_BOARD_BLOCK_ID,
          fields: {
            cardProperties: [],
            viewIds: [DEFAULT_TABLE_VIEW_BLOCK_ID, DEFAULT_BOARD_BLOCK_ID, DEFAULT_CALENDAR_VIEW_BLOCK_ID]
          }
        }
      });

  const cardProperties = [...getDefaultRewardProperties(), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

export function getDefaultView({ viewType, spaceId }: { viewType: string; spaceId: string }) {
  if (viewType === 'board') {
    return generateDefaultBoardView({ spaceId });
  }

  if (viewType === 'calendar') {
    return generateDefaultCalendarView({ spaceId });
  }

  // default to table view
  return generateDefaultTableView({ spaceId });
}
