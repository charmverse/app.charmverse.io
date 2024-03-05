import type { Block } from '@charmverse/core/prisma';
import { RPCList } from 'connectors/chains';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultRewardProperties } from 'components/rewards/components/RewardsBoard/utils/getDefaultRewardProperties';
import type { Block as FBBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

export const tokenChainOptions: IPropertyTemplate['options'] = RPCList.map((rpc) => ({
  id: rpc.chainId.toString(),
  value: rpc.chainName,
  color: ''
}));

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
