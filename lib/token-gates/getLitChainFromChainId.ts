import type { Chain } from 'lit-js-sdk';
import { ALL_LIT_CHAINS } from 'lit-js-sdk';

// default to 1 (ethereum) otherwise lit falls back to solana, which has no chainId!
export default function getLitChainFromChainId (chainId: number = 1): Chain {
  const litChain = Object.entries(ALL_LIT_CHAINS).find(([, c]) => c.chainId === chainId);
  return (litChain?.[0] || 'ethereum') as Chain;
}
