import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { getBuilderContractAddress, builderNftChain } from '../constants';

import { BuilderNFTSeasonOneStarterPackImplementationClient } from './BuilderNFTSeasonOneStarterPackImplementationClient';

export const builderContractStarterPackReadonlyApiClient = new BuilderNFTSeasonOneStarterPackImplementationClient({
  chain: builderNftChain,
  contractAddress: getBuilderContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
