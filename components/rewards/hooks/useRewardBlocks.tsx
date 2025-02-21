import { isTruthy } from '@packages/lib/utils/types';
import * as http from '@root/adapters/http';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { v4 } from 'uuid';

import { useDeleteRewardBlocks, useGetRewardBlocks, useUpdateRewardBlocks } from 'charmClient/hooks/rewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type {
  RewardBlockInput,
  RewardBlockUpdateInput,
  RewardBlockWithTypedFields,
  RewardsBoardFFBlock
} from 'lib/rewards/blocks/interfaces';

import { useRewardsBoard } from './useRewardsBoard';

export type RewardBlocksContextType = {
  rewardBlocks: (RewardBlockWithTypedFields | BoardView | Board)[] | undefined;
  rewardsBoardBlock: RewardsBoardFFBlock;
  isLoading: boolean;
  createProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  updateProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  deleteProperty: (id: string) => Promise<void>;
  updateBlock: (block: RewardBlockUpdateInput) => Promise<RewardBlockWithTypedFields | void>;
  updateBlocks: (blocks: RewardBlockUpdateInput[]) => Promise<RewardBlockWithTypedFields[] | void>;
  createBlock: (block: RewardBlockInput) => Promise<RewardBlockWithTypedFields | void>;
  createBlocks: (block: RewardBlockInput[]) => Promise<RewardBlockWithTypedFields[] | void>;
  deleteBlock: (blockId: string) => Promise<RewardBlockWithTypedFields | void>;
  deleteBlocks: (blockIds: string[]) => Promise<RewardBlockWithTypedFields[] | void>;
  getBlock: (blockId: string) => Promise<RewardBlockWithTypedFields | void>;
};

export const RewardBlocksContext = createContext<Readonly<RewardBlocksContextType> | null>(null);

export function RewardBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { data: rewardBlocks, isLoading, mutate } = useGetRewardBlocks({ spaceId: space?.id });
  const { trigger: updateRewardBlocks } = useUpdateRewardBlocks(space?.id || '');
  const { trigger: deleteRewardBlocks } = useDeleteRewardBlocks(space?.id || '');
  const { showMessage } = useSnackbar();
  const { boardBlock: rewardsBoardBlock, createProperty, deleteProperty, updateProperty } = useRewardsBoard();

  const getBlock = useCallback(
    async (blockId: string): Promise<RewardBlockWithTypedFields> => {
      const blocks = await http.GET<RewardBlockWithTypedFields[]>(`/api/spaces/${space?.id}/rewards/blocks`, {
        blockId
      });
      return blocks[0];
    },
    [space?.id]
  );

  const updateBlockCache = useCallback(
    (updatedBlocks: RewardBlockWithTypedFields | RewardBlockWithTypedFields[]) => {
      mutate(
        (blocks) => {
          if (!blocks) return blocks;
          const updatedCache = [...blocks];
          const updated = Array.isArray(updatedBlocks) ? updatedBlocks : [updatedBlocks];

          updated.forEach((updatedBlock) => {
            const index = updatedCache.findIndex((b) => b.id === updatedBlock.id);
            if (index !== -1) {
              updatedCache[index] = updatedBlock;
            } else {
              updatedCache.push(updatedBlock);
            }
          });

          return updatedCache;
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const updateBlocks = useCallback(
    async (updatedBlocks: RewardBlockUpdateInput[]) => {
      if (!space) {
        return;
      }

      try {
        const res = await updateRewardBlocks(updatedBlocks);

        if (!res) {
          return;
        }

        updateBlockCache(res);
        return res;
      } catch (e: any) {
        showMessage(`Failed to update blocks: ${e.message}`, 'error');
      }
    },
    [showMessage, space, updateBlockCache, updateRewardBlocks]
  );

  const updateBlock = useCallback(
    async (updatedBlock: RewardBlockUpdateInput) => {
      const res = await updateBlocks([updatedBlock]);

      return res?.[0];
    },
    [updateBlocks]
  );

  const createBlocks = useCallback(
    async (blocksInput: (RewardBlockInput & { id?: string })[]) => {
      if (!space) {
        return;
      }

      try {
        const res = await updateRewardBlocks(blocksInput);

        if (!res) {
          return;
        }

        updateBlockCache(res);
        return res;
      } catch (e: any) {
        showMessage(`Failed to update block: ${e.message}`, 'error');
      }
    },
    [updateRewardBlocks, showMessage, space, updateBlockCache]
  );

  const createBlock = useCallback(
    async (blockInput: RewardBlockInput & { id?: string }) => {
      if (!space) {
        return;
      }
      const newBlock = { ...blockInput, spaceId: space.id, id: blockInput.id || v4() };
      const res = await createBlocks([newBlock]);

      if (!res) {
        return;
      }

      return res[0];
    },
    [space, createBlocks]
  );

  const deleteBlocks = useCallback(
    async (blockIds: string[]) => {
      await deleteRewardBlocks({ blockIds });

      const deletedBlocks = rewardBlocks?.filter((block) => blockIds.includes(block.id))?.filter(isTruthy);

      if (!deletedBlocks) {
        return [];
      }

      updateBlockCache(deletedBlocks);

      return deletedBlocks;
    },
    [deleteRewardBlocks, rewardBlocks, updateBlockCache]
  );

  const deleteBlock = useCallback(
    async (blockId: string) => {
      const deletedBlocks = await deleteBlocks([blockId]);

      return deletedBlocks?.[0];
    },
    [deleteBlocks]
  );

  const value = useMemo(
    () => ({
      rewardBlocks,
      rewardsBoardBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      updateBlocks,
      createBlock,
      createBlocks,
      deleteBlock,
      deleteBlocks,
      getBlock
    }),
    [
      rewardBlocks,
      rewardsBoardBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      updateBlocks,
      createBlock,
      createBlocks,
      deleteBlock,
      deleteBlocks,
      getBlock
    ]
  );
  return <RewardBlocksContext.Provider value={value}>{children}</RewardBlocksContext.Provider>;
}

export const useRewardBlocks = () => {
  const context = useContext(RewardBlocksContext);
  if (!context) {
    throw new Error('useRewardBlocks must be used within a RewardBlocksProvider');
  }
  return context;
};
