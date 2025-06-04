import { PROJECT_REGISTRY_ADDRESSES } from '@packages/lib/gitcoin/constants';
import { Contract } from 'ethers';
import type { Provider, Signer } from 'ethers';

import { ProjectRegistryAbi } from './abi/ProjectRegistry';
import type { ChainId } from './projectsCount';

export function getProjectRegistryContract({
  providerOrSigner,
  chainId
}: {
  providerOrSigner: Provider | Signer;
  chainId: ChainId;
}): Contract {
  const address = PROJECT_REGISTRY_ADDRESSES[chainId];

  if (!address) {
    throw new Error(`No project registry contract address found for chain ID ${chainId}`);
  }

  const contract = new Contract(address, ProjectRegistryAbi, providerOrSigner);

  return contract;
}
