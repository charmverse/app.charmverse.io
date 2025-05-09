import { useEffect, useState } from 'react';

import { useRewardBlocks } from 'components/rewards/hooks/useRewardBlocks';
import type { RewardPropertiesField } from '@packages/lib/rewards/blocks/interfaces';

import { RewardsMutator } from '../rewardsMutator';

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
