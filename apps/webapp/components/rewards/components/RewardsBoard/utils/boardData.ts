import type { UIBlockWithDetails as FBBlock, BlockWithDetails } from '@packages/databases/block';
import { createBoard } from '@packages/databases/board';
import { blockToFBBlock } from '@packages/databases/utils/blockUtils';
import type { FeatureTitleVariation } from '@packages/features/getFeatureTitle';
import { DEFAULT_BOARD_BLOCK_ID } from '@packages/lib/rewards/blocks/constants';
import { defaultRewardViews } from '@packages/lib/rewards/blocks/views';

import { getDefaultRewardProperties } from './getDefaultRewardProperties';

export function getDefaultBoard({
  storedBoard,
  getFeatureTitle
}: {
  storedBoard: (Omit<BlockWithDetails, 'fields'> & { fields: any }) | undefined;
  getFeatureTitle: (featureName: FeatureTitleVariation) => string;
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

  const cardProperties = [...getDefaultRewardProperties({ getFeatureTitle }), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}
