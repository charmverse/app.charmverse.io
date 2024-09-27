import { getPublicClient } from '@root/lib/blockchain/publicClient';

import { builderContractAddress, builderNftChain } from './constants';
import { ContractApiClient } from './nftContractApiClient';

export const builderApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});
