import { getScoutProtocolAddress, scoutProtocolChain } from '../constants';

import { getProxyClaimsManagerWallet } from './getProxyClaimsManagerWallet';
import { ProtocolImplementationClient } from './ProtocolImplementationClient';
import { ProtocolProxyClient } from './ProtocolProxyClient';

export const protocolProxyWriteClient = new ProtocolProxyClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  walletClient: getProxyClaimsManagerWallet()
});

export const protocolImplementationWriteClient = new ProtocolImplementationClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  walletClient: getProxyClaimsManagerWallet()
});
