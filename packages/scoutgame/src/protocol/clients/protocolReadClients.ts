import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolChain, getScoutProtocolAddress, scoutProtocolChainId } from '../constants';

import { ProtocolImplementationClient } from './ProtocolImplementationClient';
import { ProtocolProxyClient } from './ProtocolProxyClient';

export const protocolProxyReadonlyApiClient = new ProtocolProxyClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  publicClient: getPublicClient(scoutProtocolChainId)
});

export const protocolImplementationReadonlyApiClient = new ProtocolImplementationClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  publicClient: getPublicClient(scoutProtocolChainId)
});
