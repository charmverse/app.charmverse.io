import { useCallback, useMemo } from 'react';

import { useGetRewardBlocks, useUpdateRewardBlocks } from 'charmClient/hooks/rewards';
import { getDefaultBoard } from 'components/rewards/components/RewardsBoard/utils/boardData';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BoardFields, IPropertyTemplate } from 'lib/focalboard/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposal/blocks/constants';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardsBoardBlock,
  RewardsBoardFFBlock
} from 'lib/rewards/blocks/interfaces';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

export function useRewardsBoard() {
  const { space } = useCurrentSpace();
  const { data: boardBlocks, isLoading, mutate } = useGetRewardBlocks({ spaceId: space?.id, type: 'board' });
  const { trigger: updateRewardBlocks } = useUpdateRewardBlocks(space?.id || '');
  const { showError } = useSnackbar();

  const block = boardBlocks?.find((b): b is RewardsBoardBlock => b.type === 'board');

  const boardBlock = useMemo(() => {
    if (block && !block.fields.cardProperties) {
      block.fields.cardProperties = [];
    }
    const board = getDefaultBoard({
      storedBoard: block
    }) as RewardsBoardFFBlock;
    return board;
  }, [block]);

  const createProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space) {
        return;
      }

      try {
        // check if a block already exists
        if (block) {
          const newCardProperties = [...(block.fields.cardProperties || []), propertyTemplate];
          const updatedBlock: RewardBlockUpdateInput = {
            ...block,
            fields: { ...(block.fields as BoardFields), cardProperties: newCardProperties }
          };
          await updateRewardBlocks([updatedBlock]);
        } else {
          // create a new board block
          const newBoardBlock: RewardBlockInput = {
            id: DEFAULT_BOARD_BLOCK_ID,
            fields: { cardProperties: [propertyTemplate], viewIds: defaultRewardViews },
            type: 'board',
            spaceId: space.id
          };
          await updateRewardBlocks([newBoardBlock]);
        }
        await mutate();
      } catch (e: any) {
        showError(`Failed to create property: ${e.message}`);
      }
    },
    [block, mutate, showError, space, updateRewardBlocks]
  );

  const updateProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space || !block) {
        return;
      }

      const updatedProperties = block.fields.cardProperties.map((p) =>
        p.id === propertyTemplate.id ? propertyTemplate : p
      );
      const updatedBlock = {
        ...block,
        fields: {
          ...(block.fields as BoardFields),
          cardProperties: updatedProperties
        }
      };

      try {
        const res = await updateRewardBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        mutate();
        return res[0].id;
      } catch (e: any) {
        showError(`Failed to update property: ${e.message}`);
      }
    },
    [block, showError, space, mutate, updateRewardBlocks]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !block) {
        return;
      }

      const updatedProperties = block.fields.cardProperties.filter((p) => p.id !== propertyTemplateId);
      const updatedBlock = {
        ...block,
        fields: { ...(block.fields as BoardFields), cardProperties: updatedProperties }
      };
      try {
        const res = await updateRewardBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        mutate();
      } catch (e: any) {
        showError(`Failed to delete property: ${e.message}`);
      }
    },
    [block, showError, space, mutate, updateRewardBlocks]
  );

  return {
    boardBlock,
    isLoading,
    createProperty,
    updateProperty,
    deleteProperty
  };
}
