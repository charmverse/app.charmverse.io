import { useEffect, useState } from 'react';

import { RewardsMutator } from 'components/rewards/components/RewardProperties/rewardsMutator';
import { useRewardBlocks } from 'hooks/useRewardBlocks';
import type { RewardPropertiesField } from 'lib/rewards/blocks/interfaces';

type Props = {
  onChange?: (values: RewardPropertiesField) => void;
};

export function usePropertiesMutator({ onChange }: Props) {
  const blocksContext = useRewardBlocks();
  const [mutator, setMutator] = useState<RewardsMutator | null>(null);

  useEffect(() => {
    const instance = new RewardsMutator(blocksContext, onChange);
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
