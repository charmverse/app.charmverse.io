import { getPublicClient } from '@packages/onchain/getPublicClient';

import { BuilderNFTSeasonOneClient } from './builderNFTSeasonOneClient';
import { builderContractAddress, builderNftChain } from './constants';

export const builderApiClient = new BuilderNFTSeasonOneClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});
