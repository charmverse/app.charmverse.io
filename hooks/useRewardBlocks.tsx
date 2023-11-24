import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { v4 } from 'uuid';

import * as http from 'adapters/http';
import { useGetRewardBlocks, useUpdateRewardBlocks } from 'charmClient/hooks/rewards';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposal/blocks/constants';
import type {
  RewardBlockInput,
  RewardBlockWithTypedFields,
  RewardPropertiesBlock
} from 'lib/rewards/blocks/interfaces';

export type RewardBlocksContextType = {
  rewardBlocks: (RewardBlockWithTypedFields | BoardView | Board)[] | undefined;
  rewardBoardBlock: RewardPropertiesBlock | undefined;
  isLoading: boolean;
  createProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  updateProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  deleteProperty: (id: string) => Promise<void>;
  updateBlock: (block: RewardBlockWithTypedFields) => Promise<RewardBlockWithTypedFields | void>;
  updateBlocks: (blocks: RewardBlockWithTypedFields[]) => Promise<RewardBlockWithTypedFields[] | void>;
  createBlock: (block: RewardBlockInput) => Promise<RewardBlockWithTypedFields | void>;
  getBlock: (blockId: string) => Promise<RewardBlockWithTypedFields | void>;
};

export const RewardBlocksContext = createContext<Readonly<RewardBlocksContextType>>({
  rewardBlocks: undefined,
  rewardBoardBlock: undefined,
  isLoading: false,
  createProperty: async () => {},
  updateProperty: async () => {},
  deleteProperty: async () => {},
  updateBlock: async () => {},
  updateBlocks: async () => {},
  createBlock: async () => {},
  getBlock: async () => {}
});

export function RewardBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { rewards } = useRewards();
  const {
    data: rewardBlocks,
    isLoading,
    mutate
  } = useGetRewardBlocks({ spaceId: rewards?.length ? space?.id : undefined });
  const { trigger: updateRewardBlocks } = useUpdateRewardBlocks(space?.id || '');
  const { showMessage } = useSnackbar();

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

          const udpatedCache = [...blocks];
          const updated = Array.isArray(updatedBlocks) ? updatedBlocks : [updatedBlocks];

          updated.forEach((updatedBlock) => {
            const index = udpatedCache.findIndex((b) => b.id === updatedBlock.id);
            if (index !== -1) {
              udpatedCache[index] = updatedBlock;
            } else {
              udpatedCache.push(updatedBlock);
            }
          });

          return udpatedCache;
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const rewardBoardBlock = useMemo(
    () => rewardBlocks?.find((b): b is RewardPropertiesBlock => b.type === 'board'),
    [rewardBlocks]
  );

  const createProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space) {
        return;
      }

      try {
        if (rewardBoardBlock) {
          const updatedProperties = [...rewardBoardBlock.fields.cardProperties, propertyTemplate];
          const updatedBlock = { ...rewardBoardBlock, fields: { cardProperties: updatedProperties } };
          const res = await updateRewardBlocks([updatedBlock]);

          if (!res) {
            return;
          }

          updateBlockCache(res[0]);

          return res[0].id;
        } else {
          const propertiesBlock = {
            id: DEFAULT_BOARD_BLOCK_ID,
            fields: { cardProperties: [propertyTemplate] },
            type: 'board',
            spaceId: space.id
          };
          const res = await updateRewardBlocks([propertiesBlock as RewardBlockInput]);

          if (!res) {
            return;
          }

          mutate(
            (blocks) => {
              if (!blocks) return blocks;
              return [...blocks, res[0]];
            },
            { revalidate: false }
          );

          return res[0].id;
        }
      } catch (e: any) {
        showMessage(`Failed to create property: ${e.message}`, 'error');
      }
    },
    [mutate, rewardBoardBlock, showMessage, space, updateBlockCache, updateRewardBlocks]
  );

  const updateProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space || !rewardBoardBlock) {
        return;
      }

      const updatedProperties = rewardBoardBlock.fields.cardProperties.map((p) =>
        p.id === propertyTemplate.id ? propertyTemplate : p
      );
      const updatedBlock = { ...rewardBoardBlock, fields: { cardProperties: updatedProperties } };

      try {
        const res = await updateRewardBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0].id;
      } catch (e: any) {
        showMessage(`Failed to update property: ${e.message}`, 'error');
      }
    },
    [rewardBoardBlock, showMessage, space, updateBlockCache, updateRewardBlocks]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !rewardBoardBlock) {
        return;
      }

      const updatedProperties = rewardBoardBlock.fields.cardProperties.filter((p) => p.id !== propertyTemplateId);
      const updatedBlock = { ...rewardBoardBlock, fields: { cardProperties: updatedProperties } };
      try {
        const res = await updateRewardBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
      } catch (e: any) {
        showMessage(`Failed to delete property: ${e.message}`, 'error');
      }
    },
    [rewardBoardBlock, showMessage, space, updateBlockCache, updateRewardBlocks]
  );

  const updateBlocks = useCallback(
    async (updatedBlocks: RewardBlockWithTypedFields[]) => {
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
    async (updatedBlock: RewardBlockWithTypedFields) => {
      const res = await updateBlocks([updatedBlock]);

      return res?.[0];
    },
    [updateBlocks]
  );

  const createBlock = useCallback(
    async (blockInput: RewardBlockInput & { id?: string }) => {
      if (!space) {
        return;
      }

      try {
        const newBlock = { ...blockInput, spaceId: space.id, id: blockInput.id || v4() };
        const res = await updateRewardBlocks([newBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0];
      } catch (e: any) {
        showMessage(`Failed to update block: ${e.message}`, 'error');
      }
    },
    [updateRewardBlocks, showMessage, space, updateBlockCache]
  );

  const value = useMemo(
    () => ({
      rewardBlocks,
      rewardBoardBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      updateBlocks,
      createBlock,
      getBlock
    }),
    [
      rewardBlocks,
      rewardBoardBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      updateBlocks,
      createBlock,
      getBlock
    ]
  );
  return <RewardBlocksContext.Provider value={value}>{children}</RewardBlocksContext.Provider>;
}

export const useRewardBlocks = () => useContext(RewardBlocksContext);
