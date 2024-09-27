import { BuilderNFTSeasonOneClient } from './builderNFTSeasonOneClient';
import { builderContractAddress, builderNftChain } from './constants';
import { getScoutGameNftAdminWallet } from './getScoutGameNftAdminWallet';

// lazily create the client to avoid exceptions if the environment is not configured
export const getBuilderContractAdminClient = () =>
  new BuilderNFTSeasonOneClient({
    chain: builderNftChain,
    contractAddress: builderContractAddress,
    walletClient: getScoutGameNftAdminWallet()
  });
