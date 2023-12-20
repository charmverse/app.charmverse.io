import { useEffect, useState } from 'react';

import { ProposalsMutator } from 'components/proposals/ProposalPage/components/ProposalProperties/proposalsMutator';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { ProposalFieldsProp, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

type Props = {
  proposal: { spaceId?: string; id?: string } & ProposalFieldsProp;
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
