import { getWalletClient } from '@packages/onchain/getWalletClient';

import { builderNftChain, builderSmartContractOwnerKey } from './constants';

export function getScoutGameNftAdminWallet() {
  if (!builderSmartContractOwnerKey) {
    throw new Error('Builder smart contract owner key not set');
  }
  return getWalletClient({
    chainId: builderNftChain.id,
    privateKey: builderSmartContractOwnerKey
  });
}
