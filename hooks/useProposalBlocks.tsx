import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { ProposalBlockWithTypedFields, ProposalPropertiesBlock } from 'lib/proposal/blocks/interfaces';

type ProposalBlocksContextType = {
  proposalBlocks: ProposalBlockWithTypedFields[] | undefined;
  proposalPropertiesBlock: ProposalPropertiesBlock | undefined;
  isLoading: boolean;
};

export const ProposalBlocksContext = createContext<Readonly<ProposalBlocksContextType>>({
  proposalBlocks: undefined,
  proposalPropertiesBlock: undefined,
  isLoading: false
});

export function ProposalBlocksProvider({ children }: { children: ReactNode }) {
  const { space } = useCurrentSpace();
  const {
    data: proposalBlocks,
    isLoading,
    mutate
  } = useSWR(space ? ['proposalBlocks', space.id] : null, () => charmClient.proposals.getProposalBlocks(space!.id));

  const proposalPropertiesBlock = useMemo(
    () => proposalBlocks?.find((b): b is ProposalPropertiesBlock => b.type === 'properties'),
    [proposalBlocks]
  );

  const value = useMemo(
    () => ({
      proposalBlocks,
      proposalPropertiesBlock,
      isLoading
    }),
    [isLoading, proposalBlocks, proposalPropertiesBlock]
  );

  return <ProposalBlocksContext.Provider value={value}>{children}</ProposalBlocksContext.Provider>;
}

export const useProposalBlocks = () => useContext(ProposalBlocksContext);
