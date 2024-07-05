import { useFormContext } from 'react-hook-form';

import type { FormValues } from '../hooks/useCollectablesForm';

import { TokenGateHypersub } from './TokenGateHypersub';
import { TokenGateNft } from './TokenGateNft';
import { TokenGatePoap } from './TokenGatePoap';
import { TokenGateUnlockProtocol } from './TokenGateUnlockProtocol';

export function TokenGateCollectableFields() {
  const { watch } = useFormContext<FormValues>();
  const collectableOption = watch('collectableOption');

  if (collectableOption === 'ERC721' || collectableOption === 'ERC1155') {
    return <TokenGateNft />;
  }

  if (collectableOption === 'POAP') {
    return <TokenGatePoap />;
  }

  if (collectableOption === 'Unlock') {
    return <TokenGateUnlockProtocol />;
  }

  if (collectableOption === 'Hypersub') {
    return <TokenGateHypersub />;
  }

  return null;
}
