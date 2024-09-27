import { getWalletClient } from '@packages/onchain/getWalletClient';

import { builderNftChain, builderSmartContractOwnerKey } from './constants';

export function getScoutGameNftAdminWallet() {
  return getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });
}
