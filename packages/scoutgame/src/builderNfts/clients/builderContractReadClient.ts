import { getPublicClient } from '@packages/onchain/getPublicClient';

import { getBuilderContractAddress, builderNftChain } from '../constants';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

export const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
  chain: builderNftChain,
  contractAddress: getBuilderContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
