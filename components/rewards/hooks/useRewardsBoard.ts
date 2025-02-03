import { useCallback, useEffect, useMemo } from 'react';

import { useGetRewardBlocks, useUpdateRewardBlocks } from 'charmClient/hooks/rewards';
import { getDefaultBoard } from 'components/rewards/components/RewardsBoard/utils/boardData';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardsBoardBlock,
  RewardsBoardFFBlock
} from 'lib/rewards/blocks/interfaces';
import { defaultRewardViews } from 'lib/rewards/blocks/views';
import type { WebSocketPayload } from 'lib/websockets/interfaces';

export function useRewardsBoard() {
  const { space } = useCurrentSpace();
  const { getFeatureTitle } = useSpaceFeatures();
  const { data: blocksFromDB, isLoading, mutate } = useGetRewardBlocks({ spaceId: space?.id, type: 'board' });
  const { trigger: updateRewardBlocks } = useUpdateRewardBlocks(space?.id || '');
  const { showError } = useSnackbar();

  const dbBlock = blocksFromDB?.find((b): b is RewardsBoardBlock => b.type === 'board');

  const boardBlock = useMemo(() => {
    if (dbBlock && !dbBlock.fields.cardProperties) {
      dbBlock.fields.cardProperties = [];
    }
    const board = getDefaultBoard({
      storedBoard: dbBlock,
      getFeatureTitle
    }) as RewardsBoardFFBlock;
    return board;
  }, [dbBlock, getFeatureTitle]);

  const { subscribe } = useWebSocketClient();

  const handleRewardBlockUpdates = useCallback((updatedRewardBlocks: WebSocketPayload<'reward_blocks_updated'>) => {
    const updatedRewardBoardBlock = updatedRewardBlocks.find((b) => b.id === DEFAULT_BOARD_BLOCK_ID);
    if (updatedRewardBoardBlock) {
      mutate();
    }
  }, []);

  useEffect(() => {
    const unsubscribeFromRewardBlockUpdates = subscribe('reward_blocks_updated', handleRewardBlockUpdates);

    return () => {
      unsubscribeFromRewardBlockUpdates();
    };
  }, []);

  const createProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space) {
        return;
      }

      try {
        // check if a block already exists
        if (dbBlock) {
          const newCardProperties = [...(dbBlock.fields.cardProperties || []), propertyTemplate];
          const updatedBlock: RewardBlockUpdateInput = {
            ...dbBlock,
            fields: { ...(dbBlock.fields as BoardFields), cardProperties: newCardProperties }
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
    [dbBlock, mutate, showError, space, updateRewardBlocks]
  );

  const updateProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space || !dbBlock) {
        return;
      }

      const updatedProperties = dbBlock.fields.cardProperties.map((p) =>
        p.id === propertyTemplate.id ? propertyTemplate : p
      );
      const updatedBlock = {
        ...dbBlock,
        fields: {
          ...(dbBlock.fields as BoardFields),
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
    [dbBlock, showError, space, mutate, updateRewardBlocks]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !dbBlock) {
        return;
      }

      const updatedProperties = dbBlock.fields.cardProperties.map((p) =>
        p.id === propertyTemplateId
          ? {
              ...p,
              deletedAt: new Date().toISOString()
            }
          : p
      );
      const updatedBlock = {
        ...dbBlock,
        fields: { ...(dbBlock.fields as BoardFields), cardProperties: updatedProperties }
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
    [dbBlock, showError, space, mutate, updateRewardBlocks]
  );

  return {
    boardBlock,
    isLoading,
    createProperty,
    updateProperty,
    deleteProperty
  };
}
