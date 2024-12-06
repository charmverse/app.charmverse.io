import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';
import { getScoutGameNftMinterWallet } from '../getScoutGameNftMinterWallet';

import { BuilderNFTSeasonOneStarterPackImplementationClient } from './BuilderNFTSeasonOneStarterPackImplementationClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractStarterPackMinterClient() {
  const contractAddress = getBuilderStarterPackContractAddress();
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new BuilderNFTSeasonOneStarterPackImplementationClient({
    chain: builderNftChain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
