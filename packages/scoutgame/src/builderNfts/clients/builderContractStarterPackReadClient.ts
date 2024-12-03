import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';

import { BuilderNFTSeasonOneStarterPackImplementationClient } from './BuilderNFTSeasonOneStarterPackImplementationClient';

export const builderContractStarterPackReadonlyApiClient = new BuilderNFTSeasonOneStarterPackImplementationClient({
  chain: builderNftChain,
  contractAddress: getBuilderStarterPackContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
