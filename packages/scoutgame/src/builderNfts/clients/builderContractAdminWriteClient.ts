import { builderContractAddress, builderNftChain } from '../constants';
import { getScoutGameNftAdminWallet } from '../getScoutGameNftAdminWallet';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractAdminClient() {
  return new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress: builderContractAddress,
    walletClient: getScoutGameNftAdminWallet()
  });
}
