import { builderContractAddress, builderNftChain } from './constants';
import { getScoutGameNftAdminWallet } from './getScoutGameNftAdminWallet';
import { ContractApiClient } from './nftContractApiClient';

// lazily create the client to avoid exceptions if the environment is not configured
export const getContractClient = () =>
  new ContractApiClient({
    chain: builderNftChain,
    contractAddress: builderContractAddress,
    walletClient: getScoutGameNftAdminWallet()
  });
