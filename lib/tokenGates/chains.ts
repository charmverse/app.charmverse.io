import { ALL_LIT_CHAINS as ALL_LIT_CHAINS_ORIGINAL, LIT_CHAINS as LIT_CHAINS_ORIGINAL } from '@lit-protocol/constants';
import { base, zora } from 'viem/chains';

const baseChain = {
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

const zoraChain = {
  contractAddress: null,
  chainId: zora.id,
  name: zora.name,
  symbol: zora.nativeCurrency.symbol,
  decimals: zora.nativeCurrency.decimals,
  rpcUrls: zora.rpcUrls.default.http.slice(),
  blockExplorerUrls: [zora.blockExplorers.default.url],
  type: null,
  vmType: 'EVM'
};

export const ALL_LIT_CHAINS = Object.assign(ALL_LIT_CHAINS_ORIGINAL, { base: baseChain, zora: zoraChain });
export const LIT_CHAINS = Object.assign(LIT_CHAINS_ORIGINAL, { base: baseChain, zora: zoraChain });
