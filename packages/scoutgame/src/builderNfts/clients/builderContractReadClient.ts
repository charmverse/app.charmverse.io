import { getPublicClient } from '@packages/onchain/getPublicClient';

import { builderContractAddress, builderNftChain } from '../constants';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

export const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});
