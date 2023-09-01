import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { v4 } from 'uuid';

import * as http from 'adapters/http';
import { useCreateProposalBlocks, useGetProposalBlocks, useUpdateProposalBlocks } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type {
  ProposalBlockInput,
  ProposalBlockWithTypedFields,
  ProposalPropertiesBlock
} from 'lib/proposal/blocks/interfaces';

export type ProposalBlocksContextType = {
  proposalBlocks: ProposalBlockWithTypedFields[] | undefined;
  proposalPropertiesBlock: ProposalPropertiesBlock | undefined;
  isLoading: boolean;
  createProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  updateProperty: (propertyTemplate: IPropertyTemplate) => Promise<string | void>;
  deleteProperty: (id: string) => Promise<void>;
  updateBlock: (block: ProposalBlockWithTypedFields) => Promise<ProposalBlockWithTypedFields | void>;
  createBlock: (block: ProposalBlockInput) => Promise<ProposalBlockWithTypedFields | void>;
  getBlock: (blockId: string) => Promise<ProposalBlockWithTypedFields | void>;
};

export const ProposalBlocksContext = createContext<Readonly<ProposalBlocksContextType>>({
  proposalBlocks: undefined,
  proposalPropertiesBlock: undefined,
  isLoading: false,
  createProperty: async () => {},
  updateProperty: async () => {},
  deleteProperty: async () => {},
  updateBlock: async () => {},
  createBlock: async () => {},
  getBlock: async () => {}
});

export function ProposalBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const { data: proposalBlocks, isLoading, mutate } = useGetProposalBlocks(space?.id);
  const { trigger: createProposalBlocks } = useCreateProposalBlocks(space?.id || '');
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
    (updatedBlock: ProposalBlockWithTypedFields) => {
      mutate(
        (blocks) => {
          if (!blocks) return blocks;
          const hasBlock = blocks.find((b) => b.id === updatedBlock.id);

          if (hasBlock) {
            return blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
          } else {
            return [...blocks, updatedBlock];
          }
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const proposalPropertiesBlock = useMemo(
    () => proposalBlocks?.find((b): b is ProposalPropertiesBlock => b.type === 'properties'),
    [proposalBlocks]
  );

  const createProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space) {
        return;
      }

      try {
        if (proposalPropertiesBlock) {
          const updatedProperties = [...proposalPropertiesBlock.fields.properties, propertyTemplate];
          const updatedBlock = { ...proposalPropertiesBlock, fields: { properties: updatedProperties } };
          const res = await updateProposalBlocks([updatedBlock]);

          if (!res) {
            return;
          }

          updateBlockCache(res[0]);

          return res[0].id;
        } else {
          const propertiesBlock = { fields: { properties: [propertyTemplate] }, type: 'properties', spaceId: space.id };
          const res = await createProposalBlocks([propertiesBlock as ProposalBlockInput]);

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
    [createProposalBlocks, mutate, proposalPropertiesBlock, showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const updateProperty = useCallback(
    async (propertyTemplate: IPropertyTemplate) => {
      if (!space || !proposalPropertiesBlock) {
        return;
      }

      const updatedProperties = proposalPropertiesBlock.fields.properties.map((p) =>
        p.id === propertyTemplate.id ? propertyTemplate : p
      );
      const updatedBlock = { ...proposalPropertiesBlock, fields: { properties: updatedProperties } };

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
    [proposalPropertiesBlock, showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !proposalPropertiesBlock) {
        return;
      }

      const updatedProperties = proposalPropertiesBlock.fields.properties.filter((p) => p.id !== propertyTemplateId);
      const updatedBlock = { ...proposalPropertiesBlock, fields: { properties: updatedProperties } };
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
    [proposalPropertiesBlock, showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const updateBlock = useCallback(
    async (updatedBlock: ProposalBlockWithTypedFields) => {
      if (!space) {
        return;
      }

      try {
        const res = await updateProposalBlocks([updatedBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0];
      } catch (e: any) {
        showMessage(`Failed to update block: ${e.message}`, 'error');
      }
    },
    [showMessage, space, updateBlockCache, updateProposalBlocks]
  );

  const createBlock = useCallback(
    async (blockInput: ProposalBlockInput & { id?: string }) => {
      if (!space) {
        return;
      }

      try {
        const newBlock = { ...blockInput, spaceId: space.id, id: blockInput.id || v4() };
        const res = await createProposalBlocks([newBlock]);

        if (!res) {
          return;
        }

        updateBlockCache(res[0]);
        return res[0];
      } catch (e: any) {
        showMessage(`Failed to update block: ${e.message}`, 'error');
      }
    },
    [createProposalBlocks, showMessage, space, updateBlockCache]
  );

  const value = useMemo(
    () => ({
      proposalBlocks,
      proposalPropertiesBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      createBlock,
      getBlock
    }),
    [
      proposalBlocks,
      proposalPropertiesBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock,
      createBlock,
      getBlock
    ]
  );

  return <ProposalBlocksContext.Provider value={value}>{children}</ProposalBlocksContext.Provider>;
}

export const useProposalBlocks = () => useContext(ProposalBlocksContext);
