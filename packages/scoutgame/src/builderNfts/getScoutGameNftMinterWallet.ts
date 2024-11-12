import { getWalletClient } from '@packages/blockchain/getWalletClient';

import { builderNftChain, builderSmartContractMinterKey } from './constants';

export function getScoutGameNftMinterWallet() {
  if (!builderSmartContractMinterKey) {
    throw new Error('Builder smart contract owner key not set');
  }
  return getWalletClient({
    chainId: builderNftChain.id,
    privateKey: builderSmartContractMinterKey
  });
}
