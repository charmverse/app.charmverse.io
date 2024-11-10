import { getScoutProtocolAddress, scoutProtocolChain } from '../constants';

import { getProxyClaimsManagerWallet } from './getProxyClaimsManagerWallet';
import { ProtocolImplementationClient } from './ProtocolImplementationClient';
import { ProtocolProxyClient } from './ProtocolProxyClient';

export function protocolProxyWriteClient() {
  return new ProtocolProxyClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProxyClaimsManagerWallet()
  });
}

export function protocolImplementationWriteClient() {
  return new ProtocolImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProxyClaimsManagerWallet()
  });
}
