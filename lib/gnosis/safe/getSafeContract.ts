import type { Provider } from '@ethersproject/providers';
import type { Signer } from 'ethers';
import { Contract } from 'ethers';

import SafeAbi from './abi/SafeAbi.json';

export function getSafeContract({
  providerOrSigner,
  address
}: {
  providerOrSigner: Provider | Signer;
  address: string;
}): Contract {
  if (!address) {
    throw new Error(`Safe address was not provided`);
  }

  const contract = new Contract(address, SafeAbi, providerOrSigner);

  return contract;
}
