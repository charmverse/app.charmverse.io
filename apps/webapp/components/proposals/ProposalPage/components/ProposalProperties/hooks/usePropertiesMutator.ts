import { useEffect, useState } from 'react';

import { ProposalsMutator } from 'components/proposals/ProposalPage/components/ProposalProperties/proposalsMutator';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { ProposalPropertiesField } from '@packages/lib/proposals/blocks/interfaces';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string; fields: ProposalFields | null };
  onChange?: (values: ProposalPropertiesField) => void;
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
