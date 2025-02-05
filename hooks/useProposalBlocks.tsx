import * as http from '@root/adapters/http';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { v4 } from 'uuid';

import { useGetProposalBlocks, useUpdateProposalBlocks } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import type {
  ProposalBlockInput,
  ProposalBlockWithTypedFields,
  ProposalBoardBlock
} from 'lib/proposals/blocks/interfaces';

export type ProposalBlocksContextType = {
  proposalBlocks: ProposalBlockWithTypedFields[] | undefined;
  proposalBoardBlock: ProposalBoardBlock | undefined;
  isLoading: boolean;
  createProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  updateProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  deleteProperty: (id: string) => Promise<void>;
  updateBlock: (block: ProposalBlockWithTypedFields) => Promise<ProposalBlockWithTypedFields | void>;
  updateBlocks: (blocks: ProposalBlockWithTypedFields[]) => Promise<ProposalBlockWithTypedFields[] | void>;
  createBlock: (block: ProposalBlockInput) => Promise<ProposalBlockWithTypedFields | void>;
  getBlock: (blockId: string) => Promise<ProposalBlockWithTypedFields | void>;
};

export const ProposalBlocksContext = createContext<Readonly<ProposalBlocksContextType>>({
  proposalBlocks: undefined,
  proposalBoardBlock: undefined,
  isLoading: false,
  createProperty: async () => {},
  updateProperty: async () => {},
  deleteProperty: async () => {},
  updateBlock: async () => {},
  updateBlocks: async () => {},
  createBlock: async () => {},
  getBlock: async () => {}
});

export function ProposalBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { data: proposalBlocks, isLoading, mutate } = useGetProposalBlocks(space?.id);
  const { trigger: updateProposalBlocks } = useUpdateProposalBlocks(space?.id || '');
  const { showMessage } = useSnackbar();

  const getBlock = useCallback(
    async (blockId: string): Promise<ProposalBlockWithTypedFields> => {
      const blocks = await http.GET<ProposalBlockWithTypedFields[]>(`/api/spaces/${space?.id}/proposals/blocks`, {
        blockId
      });
      return blocks[0];
    },
    [space?.id]
  );

  const updateBlockCache = useCallback(
    (updatedBlocks: ProposalBlockWithTypedFields | ProposalBlockWithTypedFields[]) => {
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

  const proposalBoardBlock = useMemo(
    () => proposalBlocks?.find((b): b is ProposalBoardBlock => b.id === DEFAULT_BOARD_BLOCK_ID),
    [proposalBlocks]
  );

  const createProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space) {
        return;
      }

      try {
        if (proposalBoardBlock) {
          const updatedProperties = [...proposalBoardBlock.fields.cardProperties, propertyTemplate];
          const updatedBlock = {
            ...proposalBoardBlock,
            fields: { ...(proposalBoardBlock.fields as BoardFields), cardProperties: updatedProperties }
          };
          const res = await updateProposalBlocks([updatedBlock]);

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
          const res = await updateProposalBlocks([propertiesBlock as ProposalBlockInput]);

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
    [updateProposalBlocks, mutate, proposalBoardBlock, showMessage, space, updateBlockCache]
  );

  const updateProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space || !proposalBoardBlock) {
        return;
      }

      const updatedProperties = proposalBoardBlock.fields.cardProperties.map((p) =>
        p.id === propertyTemplate.id ? propertyTemplate : p
      );
      const updatedBlock = {
        ...proposalBoardBlock,
        fields: { ...(proposalBoardBlock.fields as BoardFields), cardProperties: updatedProperties }
      };

      try {
        const res = await updateProposalBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0].id;
      } catch (e: any) {
        showMessage(`Failed to update property: ${e.message}`, 'error');
      }
    },
    [proposalBoardBlock, showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !proposalBoardBlock) {
        return;
      }

      const updatedProperties = proposalBoardBlock.fields.cardProperties.map((p) =>
        p.id === propertyTemplateId
          ? {
              ...p,
              deletedAt: new Date().toISOString()
            }
          : p
      );
      const updatedBlock = { ...proposalBoardBlock, fields: { cardProperties: updatedProperties } };
      try {
        const res = await updateProposalBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
      } catch (e: any) {
        showMessage(`Failed to delete property: ${e.message}`, 'error');
      }
    },
    [proposalBoardBlock, showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const updateBlocks = useCallback(
    async (updatedBlocks: ProposalBlockWithTypedFields[]) => {
      if (!space) {
        return;
      }

      try {
        const res = await updateProposalBlocks(updatedBlocks);

        if (!res) {
          return;
        }

        updateBlockCache(res);
        return res;
      } catch (e: any) {
        showMessage(`Failed to update blocks: ${e.message}`, 'error');
      }
    },
    [showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const updateBlock = useCallback(
    async (updatedBlock: ProposalBlockWithTypedFields) => {
      const res = await updateBlocks([updatedBlock]);

      return res?.[0];
    },
    [updateBlocks]
  );

  const createBlock = useCallback(
    async (blockInput: ProposalBlockInput & { id?: string }) => {
      if (!space) {
        return;
      }

      try {
        const newBlock = { ...blockInput, spaceId: space.id, id: blockInput.id || v4() };
        const res = await updateProposalBlocks([newBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0];
      } catch (e: any) {
        showMessage(`Failed to update block: ${e.message}`, 'error');
      }
    },
    [updateProposalBlocks, showMessage, space, updateBlockCache]
  );

  const value = useMemo(
    () => ({
      proposalBlocks,
      proposalBoardBlock,
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
      proposalBlocks,
      proposalBoardBlock,
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

  return <ProposalBlocksContext.Provider value={value}>{children}</ProposalBlocksContext.Provider>;
}

export const useProposalBlocks = () => useContext(ProposalBlocksContext);
