import { Contract } from '@ethersproject/contracts';
import type { Provider } from '@ethersproject/providers';
import type { Signer } from 'ethers';

import { PROJECT_REGISTRY_ADDRESSES } from 'lib/gitcoin/constants';

import ProjectRegistryAbi from './abi/ProjectRegistry.json';

export function getProjectRegistryContract({
  providerOrSigner,
  chainId
}: {
  providerOrSigner: Provider | Signer;
  chainId: number;
}): Contract {
  const address = PROJECT_REGISTRY_ADDRESSES[chainId];

  if (!address) {
    throw new Error(`No project registry contract address found for chain ID ${chainId}`);
  }

  const contract = new Contract(address, ProjectRegistryAbi, providerOrSigner);

  return contract;
}
