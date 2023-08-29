import { useEffect, useState } from 'react';

import { ProposalsMutator } from 'components/proposals/components/ProposalProperties/proposalsMutator';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFields;
  onChange?: (values: ProposalFields) => void;
};

export function usePropertiesMutator({ onChange }: Props) {
  const blocksContext = useProposalBlocks();
  const [mutator, setMutator] = useState<ProposalsMutator | null>(null);

  useEffect(() => {
    const instance = new ProposalsMutator(blocksContext, onChange);
    setMutator(instance);
  }, []);

  useEffect(() => {
    if (mutator) {
      // keep the mutator properties updated on each render
      mutator.blocksContext = blocksContext;
    }
  });

  return mutator;
}
