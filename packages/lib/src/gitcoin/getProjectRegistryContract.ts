import { Contract } from '@ethersproject/contracts';
import type { Provider } from '@ethersproject/providers';
import { PROJECT_REGISTRY_ADDRESSES } from '@packages/lib/gitcoin/constants';
import type { Signer } from 'ethers';

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
