import { getPublicClient } from '@packages/onchain/getPublicClient';

import { builderNftChain, getBuilderContractAddress } from '../constants';

import { BuilderNFTSeasonOneUpgradeableABIClient } from './BuilderNFTSeasonOneUpgradeableABIClient';

export const builderProxyContractReadonlyApiClient = new BuilderNFTSeasonOneUpgradeableABIClient({
  chain: builderNftChain,
  contractAddress: getBuilderContractAddress(),
  publicClient: getPublicClient(builderNftChain.id)
});
