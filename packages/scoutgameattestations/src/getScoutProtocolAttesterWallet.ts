import { getWalletClient } from '@packages/blockchain/getWalletClient';

import { scoutGameAttestationChainId } from './constants';

export function getScoutProtocolAttesterWallet() {
  const scoutProtocolClaimsManagerKey = process.env.SCOUTPROTOCOL_EAS_ATTESTER_PRIVKEY as string;

  return getWalletClient({
    chainId: scoutGameAttestationChainId,
    privateKey: scoutProtocolClaimsManagerKey
  });
}
