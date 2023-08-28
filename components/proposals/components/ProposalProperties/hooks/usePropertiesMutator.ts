import { useEffect, useState } from 'react';

import { ProposalsMutator } from 'components/proposals/components/ProposalProperties/proposalsMutator';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFields;
  onChange?: (values: ProposalFields) => void;
};

export function usePropertiesMutator({ onChange }: Props) {
  // TODO: connect all methods to mutator
  const { proposalPropertiesBlock, updateBlock, updateProperty, createProperty, deleteProperty } = useProposalBlocks();
  const [mutator, setMutator] = useState<ProposalsMutator | null>(null);

  useEffect(() => {
    const instance = new ProposalsMutator(onChange);
    setMutator(instance);
  }, []);

  return mutator;
}
