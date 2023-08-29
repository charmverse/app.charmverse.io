import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
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
};

export const ProposalBlocksContext = createContext<Readonly<ProposalBlocksContextType>>({
  proposalBlocks: undefined,
  proposalPropertiesBlock: undefined,
  isLoading: false,
  createProperty: async () => {},
  updateProperty: async () => {},
  deleteProperty: async () => {},
  updateBlock: async () => {}
});

export function ProposalBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const {
    data: proposalBlocks,
    isLoading,
    mutate
  } = useSWR(space ? ['proposalBlocks', space.id] : null, () => charmClient.proposals.getProposalBlocks(space!.id));

  const updateBlockCache = useCallback(
    (updatedBlock: ProposalBlockWithTypedFields) => {
      mutate(
        (blocks) => {
          if (!blocks) return blocks;
          return blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
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

      if (proposalPropertiesBlock) {
        const updatedProperties = [...proposalPropertiesBlock.fields.properties, propertyTemplate];
        const updatedBlock = { ...proposalPropertiesBlock, fields: { properties: updatedProperties } };
        const res = await charmClient.proposals.updateProposalBlocks({ spaceId: space.id, data: [updatedBlock] });

        updateBlockCache(res[0]);

        return res[0].id;
      } else {
        const propertiesBlock = { fields: { properties: [propertyTemplate] }, type: 'properties', spaceId: space.id };
        const res = await charmClient.proposals.createProposalBlocks({
          spaceId: space.id,
          data: [propertiesBlock as ProposalBlockInput]
        });

        mutate(
          (blocks) => {
            if (!blocks) return blocks;
            return [...blocks, res[0]];
          },
          { revalidate: false }
        );

        return res[0].id;
      }
    },
    [mutate, proposalPropertiesBlock, space, updateBlockCache]
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
      const res = await charmClient.proposals.updateProposalBlocks({ spaceId: space.id, data: [updatedBlock] });

      updateBlockCache(res[0]);

      return res[0].id;
    },
    [proposalPropertiesBlock, space, updateBlockCache]
  );

  const deleteProperty = useCallback(
    async (propertyTemplateId: string) => {
      if (!space || !proposalPropertiesBlock) {
        return;
      }

      const updatedProperties = proposalPropertiesBlock.fields.properties.filter((p) => p.id !== propertyTemplateId);
      const updatedBlock = { ...proposalPropertiesBlock, fields: { properties: updatedProperties } };
      const res = await charmClient.proposals.updateProposalBlocks({ spaceId: space.id, data: [updatedBlock] });

      updateBlockCache(res[0]);
    },
    [proposalPropertiesBlock, space, updateBlockCache]
  );

  const updateBlock = useCallback(
    async (updatedBlock: ProposalBlockWithTypedFields) => {
      if (!space || !proposalBlocks?.find((b) => b.id === updatedBlock.id)) {
        return;
      }

      const res = await charmClient.proposals.updateProposalBlocks({ spaceId: space.id, data: [updatedBlock] });

      updateBlockCache(res[0]);

      return res[0];
    },
    [proposalBlocks, space, updateBlockCache]
  );

  const value = useMemo(
    () => ({
      proposalBlocks,
      proposalPropertiesBlock,
      isLoading,
      createProperty,
      updateProperty,
      deleteProperty,
      updateBlock
    }),
    [proposalBlocks, proposalPropertiesBlock, isLoading, createProperty, updateProperty, deleteProperty, updateBlock]
  );

  return <ProposalBlocksContext.Provider value={value}>{children}</ProposalBlocksContext.Provider>;
}

export const useProposalBlocks = () => useContext(ProposalBlocksContext);
