import { getBuilderContractAddress, builderNftChain } from '../constants';
import { getScoutGameNftAdminWallet } from '../getScoutGameNftAdminWallet';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractAdminClient() {
  const contractAddress = getBuilderContractAddress();
  if (!contractAddress) {
    throw new Error('Builder contract address not set');
  }
  return new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress,
    walletClient: getScoutGameNftAdminWallet()
  });
}
