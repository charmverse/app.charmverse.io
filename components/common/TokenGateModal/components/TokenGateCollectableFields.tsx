import { useFormContext } from 'react-hook-form';

import type { FormValues } from '../hooks/useCollectablesForm';

import { TokengateNft } from './TokenGateNft';
import { TokenGatePoap } from './TokenGatePoap';

export function TokenGateCollectableFields() {
  const { watch } = useFormContext<FormValues>();
  const collectableOption = watch('collectableOption');

  if (collectableOption === 'ERC721' || collectableOption === 'ERC1155') {
    return <TokengateNft />;
  }

  if (collectableOption === 'POAP') {
    return <TokenGatePoap />;
  }

  return null;
}
