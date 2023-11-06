import { ALL_LIT_CHAINS, LIT_CHAINS } from '@lit-protocol/constants';
import { humanizeAccessControlConditions } from '@lit-protocol/lit-node-client';
import { base } from 'viem/chains';

// Add missing info for Base
LIT_CHAINS.base = {
  contractAddress: null,
  chainId: base.id,
  name: base.name,
  symbol: 'ETH',
  decimals: 18,
  rpcUrls: base.rpcUrls.default.http.slice(),
  blockExplorerUrls: [base.blockExplorers.default.url],
  type: null,
  vmType: 'EVM'
};

ALL_LIT_CHAINS.base = LIT_CHAINS.base;

export function humanizeConditions(conditions: Parameters<typeof humanizeAccessControlConditions>[0]) {
  return humanizeAccessControlConditions(conditions);
}
