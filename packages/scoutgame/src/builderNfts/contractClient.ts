import { builderContractAddress, builderNftChain } from './constants';
import { getScoutGameNftAdminWallet } from './getScoutGameNftAdminWallet';
import { ContractApiClient } from './nftContractApiClient';

export const contractClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  walletClient: getScoutGameNftAdminWallet()
});
